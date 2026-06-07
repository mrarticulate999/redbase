// REDBASE API server — Express app wiring, security middleware, route mounting.
const path = require('path');
const fs = require('fs');

// Load env from the repo root .env regardless of cwd.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const prisma = require('./lib/prisma');
const { requireAuth } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const taskRoutes = require('./routes/tasks');
const clientRoutes = require('./routes/clients');
const financeRoutes = require('./routes/finance');
const learningRoutes = require('./routes/learning');
const calendarRoutes = require('./routes/calendar');
const milestoneRoutes = require('./routes/milestones');
const objectiveRoutes = require('./routes/objectives');
const strategyRoutes = require('./routes/strategy');

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Fail fast if the JWT secret is missing or weak — never run insecurely.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be set and at least 32 characters. Refusing to start.');
  process.exit(1);
}

// --- Security & parsing middleware ---
app.disable('x-powered-by');
app.set('trust proxy', 1); // behind a reverse proxy (Railway/Render/Fly handle TLS)

// Helmet security headers. A strict Content-Security-Policy is enabled in
// production; it's relaxed in dev so Vite's HMR websocket/eval works.
app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            // React inline styles + Recharts require 'unsafe-inline' for styles only.
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            fontSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"], // clickjacking protection
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    // HSTS: force HTTPS for a year (TLS terminates at the reverse proxy).
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);
app.use(compression());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / server-to-server (no Origin header) and whitelisted origins.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// --- Health check (not rate-limited, used by the platform's probes) ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// --- Global API rate limit (blunts brute-force / scraping / DoS) ---
// Login has its own stricter limiter in routes/auth.js.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600, // ~40 req/min per IP across the whole API
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});
app.use('/api', apiLimiter);

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/objectives', objectiveRoutes);
app.use('/api/strategy', strategyRoutes);

// Example of a route gated to a specific role (admin-only smoke endpoint).
app.get('/api/admin/ping', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only.' });
  res.json({ pong: true });
});

// --- Serve built client in production ---
const clientDist = path.resolve(__dirname, '../../client/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback for non-API routes.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// --- 404 for unmatched API routes ---
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// --- Central error handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && /CORS/.test(err.message)) {
    return res.status(403).json({ error: err.message });
  }
  console.error('[REDBASE] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const server = app.listen(PORT, () => {
  console.log(`REDBASE API listening on http://localhost:${PORT}`);
});

// Graceful shutdown.
async function shutdown() {
  console.log('\nShutting down REDBASE...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
