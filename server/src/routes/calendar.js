// Google Calendar: OAuth2 connect flow + fetch this/next week's events.
const express = require('express');
const { google } = require('googleapis');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { verifyToken } = require('../lib/auth');
const { encrypt, decrypt } = require('../lib/crypto');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
];

const CLIENT_URL = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0].trim();

function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
}

function makeOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Persist (or refresh) the OAuth client's credentials for a user.
async function getAuthorizedClient(userId) {
  const stored = await prisma.googleToken.findUnique({ where: { userId } });
  if (!stored) return null;

  const storedRefresh = stored.refreshToken ? decrypt(stored.refreshToken) : undefined;
  const oauth2 = makeOAuthClient();
  oauth2.setCredentials({
    access_token: decrypt(stored.accessToken),
    refresh_token: storedRefresh,
    expiry_date: stored.expiresAt ? new Date(stored.expiresAt).getTime() : undefined,
  });

  // Refresh proactively if expired and we hold a refresh token.
  if (stored.expiresAt && new Date(stored.expiresAt).getTime() < Date.now() + 60_000 && storedRefresh) {
    const { credentials } = await oauth2.refreshAccessToken();
    await prisma.googleToken.update({
      where: { userId },
      data: {
        accessToken: encrypt(credentials.access_token),
        refreshToken: encrypt(credentials.refresh_token || storedRefresh),
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : stored.expiresAt,
      },
    });
    oauth2.setCredentials(credentials);
  }

  return oauth2;
}

// 1) Build the consent URL. The JWT is passed through `state` because the
//    Google redirect can't carry our Authorization header.
router.get(
  '/oauth/url',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!googleConfigured()) {
      return res.status(503).json({ error: 'Google OAuth is not configured on the server.' });
    }
    const header = req.headers.authorization || '';
    const token = header.split(' ')[1];
    const oauth2 = makeOAuthClient();
    const url = oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state: token,
    });
    res.json({ url });
  })
);

// 2) OAuth callback — Google redirects here with ?code & ?state(=our JWT).
router.get(
  '/oauth/callback',
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(`${CLIENT_URL}/calendar?google=error`);
    }

    let userId;
    try {
      userId = verifyToken(state).sub;
    } catch {
      return res.redirect(`${CLIENT_URL}/calendar?google=error`);
    }

    const oauth2 = makeOAuthClient();
    const { tokens } = await oauth2.getToken(code);

    await prisma.googleToken.upsert({
      where: { userId },
      update: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000),
      },
      create: {
        userId,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000),
      },
    });

    res.redirect(`${CLIENT_URL}/calendar?google=connected`);
  })
);

// Connection status for the current user.
router.get(
  '/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = await prisma.googleToken.findUnique({ where: { userId: req.user.id } });
    res.json({ configured: googleConfigured(), connected: Boolean(token) });
  })
);

// Disconnect (drop stored tokens).
router.delete(
  '/disconnect',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.googleToken.deleteMany({ where: { userId: req.user.id } });
    res.json({ ok: true });
  })
);

// Fetch events for the connected user. Defaults to this week + next week,
// but accepts ?timeMin & ?timeMax (ISO) to fetch an arbitrary range (e.g. the
// month the user is currently viewing in the calendar grid).
router.get(
  '/events',
  requireAuth,
  asyncHandler(async (req, res) => {
    const oauth2 = await getAuthorizedClient(req.user.id);
    if (!oauth2) {
      return res.status(409).json({ error: 'Google Calendar not connected.', connected: false });
    }

    let start, end;
    const { timeMin, timeMax } = req.query;
    if (timeMin && timeMax && !Number.isNaN(Date.parse(timeMin)) && !Number.isNaN(Date.parse(timeMax))) {
      start = new Date(timeMin);
      end = new Date(timeMax);
    } else {
      // Default: start of this week (Monday) → end of next week (Sunday).
      const now = new Date();
      const day = (now.getUTCDay() + 6) % 7; // 0 = Monday
      start = new Date(now);
      start.setUTCDate(now.getUTCDate() - day);
      start.setUTCHours(0, 0, 0, 0);
      end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 14);
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2 });
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const events = (data.items || []).map((e) => ({
      id: e.id,
      title: e.summary || '(no title)',
      description: e.description || '',
      start: e.start?.dateTime || e.start?.date || null,
      end: e.end?.dateTime || e.end?.date || null,
      allDay: Boolean(e.start?.date && !e.start?.dateTime),
      organizer: e.organizer?.displayName || e.organizer?.email || req.user.username,
      htmlLink: e.htmlLink || null,
    }));

    res.json({ connected: true, weekStart: start.toISOString(), events });
  })
);

module.exports = router;
