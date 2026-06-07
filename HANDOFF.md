# REDBASE — Session Handoff Document
**Generated:** 2026-06-06  
**Status:** Dashboard live on Render. Google Calendar OAuth ~90% done — needs Client ID/Secret added to Render.

---

## What Was Built
Full-stack internal ops dashboard for a 3-person AI red teaming consultancy.

**Stack:** React + Vite + Tailwind (dark mode) / Node.js + Express / PostgreSQL (Neon) / Prisma ORM / JWT auth / bcrypt(12)

**Six modules:** Google Calendar (OAuth2), Team Communications (board + threads + @mentions), Tasks (Kanban, drag-drop), Finance (KPIs + Recharts + CSV export), Security Learning Pathway (5 tracks incl. OWASP LLM Top 10), Clients CRM (pipeline view)

---

## Where Everything Lives

| Thing | Location |
|---|---|
| Local code | `C:\Users\grant\Downloads\redbase` |
| GitHub repo | `https://github.com/mrarticulate999/redbase` (private, main branch) |
| Live app | `https://redbase-21zh.onrender.com` |
| Database | Neon Postgres, project `redbase`, us-east-1, role `neondb_owner` |
| Render service | `srv-d8ia47rtqb8s73aul3r0` |
| Google Cloud project | `redbase` (project ID: `redbase`) |

---

## Accounts

| Username | Role | Notes |
|---|---|---|
| `grantj05` | admin | Grant — your account |
| `abehalim` | operator | Abe |
| `rjlee` | operator | Remington |

**Passwords:** Stored in `C:\Users\grant\Downloads\redbase\.env` (gitignored) and in Render → Environment tab as `GRANTJ05_PASSWORD`, `ABEHALIM_PASSWORD`, `RJLEE_PASSWORD`.

---

## Environment Variables
All secrets live in two places only:
1. **Local:** `C:\Users\grant\Downloads\redbase\.env` (gitignored — never committed)
2. **Render:** Dashboard → redbase service → Environment tab

Keys in use: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (Render auto-generated), `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `GRANTJ05_PASSWORD`, `ABEHALIM_PASSWORD`, `RJLEE_PASSWORD`, `TOKEN_ENCRYPTION_KEY`, `CORS_ORIGIN`, and the pending `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`.

See `.env.example` in the repo root for the full annotated list of every variable.

---

## Security Hardening Done
- JWT_SECRET length enforced at boot (server refuses to start if weak)
- Global API rate limit: 600 req / 15 min per IP
- Login rate limit: 5 attempts / 15 min per IP
- Production CSP + HSTS via Helmet; `X-Powered-By` removed
- Google OAuth tokens encrypted at rest (AES-256-GCM) via `server/src/lib/crypto.js`
- Seed is env-driven — no default `password123`, never resets existing passwords on redeploy
- `npm audit`: 0 vulnerabilities (bcrypt v6 + googleapis v173)
- Full details in `SECURITY.md`

---

## Google Calendar — LAST REMAINING TASK

### What's already done:
- Google Cloud project `redbase` created ✅
- Google Calendar API enabled ✅
- OAuth consent screen configured (app: REDBASE, external, test user: johnsoga24@gmail.com) ✅
- All server-side calendar code built and deployed (`server/src/routes/calendar.js`) ✅
- `CORS_ORIGIN` set in Render ✅

### What's left (2 steps, ~5 min):

**Step 1 — Create OAuth credentials in Google Cloud Console:**
- Go to: `https://console.cloud.google.com/auth/clients/create?project=redbase`
- Application type: **Web application**
- Name: `redbase`
- Authorized redirect URI: `https://redbase-21zh.onrender.com/api/calendar/oauth/callback`
- Click **Create** → copy the Client ID and Client Secret from the popup

**Step 2 — Add to Render** (Environment tab):
```
GOOGLE_CLIENT_ID     = <paste from Google>
GOOGLE_CLIENT_SECRET = <paste from Google>
GOOGLE_REDIRECT_URI  = https://redbase-21zh.onrender.com/api/calendar/oauth/callback
```
Save → Render redeploys (~2 min)

**Step 3 — Connect:**
- Log in as `grantj05` → Calendar → "Connect Google Calendar"
- Sign in with `johnsoga24@gmail.com`
- The shared team calendar (Abe + Remington already on it) shows for all users

### Calendar design note:
Only Grant's Google account (`johnsoga24@gmail.com`) connects — Abe and Remington are already on that shared calendar, so everyone's events appear automatically. Read-only access only.

---

## Render Deployment Notes
- **Free tier** — sleeps after 15 min idle, ~50 second cold start wake
- Build: `npm install --production=false && npm --prefix client install --production=false && npm --prefix client run build && npx prisma generate`
- Start: `npx prisma migrate deploy && node prisma/seed.js && node server/src/index.js`
- Seed is idempotent — safe on every deploy, won't reset passwords unless env var changes
- Auto-deploys on every push to `main`
- Blueprint config: `render.yaml`

---

## Key File Map
```
redbase/
├── prisma/
│   ├── schema.prisma          # all DB models + enums
│   ├── seed.js                # env-driven, idempotent seeder
│   └── migrations/            # committed SQL, Render replays on deploy
├── server/src/
│   ├── index.js               # Express + security middleware + route mount
│   ├── lib/
│   │   ├── auth.js            # JWT + bcrypt helpers
│   │   ├── crypto.js          # AES-256-GCM token encryption
│   │   ├── prisma.js          # shared PrismaClient singleton
│   │   └── asyncHandler.js
│   ├── middleware/
│   │   ├── auth.js            # requireAuth, requireRole
│   │   └── validate.js        # express-validator error formatter
│   └── routes/
│       ├── auth.js            # login, /me, logout
│       ├── users.js           # team roster
│       ├── messages.js        # comms board + threads
│       ├── tasks.js           # kanban CRUD + drag moves
│       ├── clients.js         # CRM + history + pipeline
│       ├── finance.js         # entries, KPI summary, CSV export
│       ├── learning.js        # tracks, per-user progress
│       └── calendar.js        # Google OAuth flow + events
├── client/src/
│   ├── App.jsx                # React Router v6 routes
│   ├── context/AuthContext.jsx # JWT lifecycle (login/logout/bootstrap)
│   ├── lib/api.js             # fetch wrapper with Bearer token
│   ├── components/
│   │   ├── Layout.jsx         # shell with sidebar
│   │   ├── Sidebar.jsx        # nav + user avatar + sign out
│   │   ├── ProtectedRoute.jsx
│   │   └── ui.jsx             # Spinner, Modal, ErrorBanner, etc.
│   └── pages/
│       ├── Login.jsx
│       ├── Calendar.jsx
│       ├── Communications.jsx
│       ├── Tasks.jsx
│       ├── Finance.jsx
│       ├── Learning.jsx
│       └── Clients.jsx
├── .env                       # GITIGNORED — real secrets here
├── .env.example               # template with all var names documented
├── render.yaml                # Render Blueprint
├── SECURITY.md                # security posture + operator action items
└── HANDOFF.md                 # this file
```

---

## Outstanding Action Items

| Priority | Item |
|---|---|
| 🔴 **Do now** | Finish Google Calendar: create credentials at `console.cloud.google.com/auth/clients/create?project=redbase`, add to Render |
| 🟡 Medium | Rotate the Neon DB password — the original was shared in a chat session. Go to Neon → Settings → reset `neondb_owner` password → update both `DATABASE_URL` and `DIRECT_URL` in Render env vars |
| 🟡 Medium | Share `https://redbase-21zh.onrender.com` + their logins with Abe and Remington |
| 🟢 Low | Consider upgrading Render from free to paid ($7/mo) to eliminate the 50-second cold start |

---

## Descoped / Not Built
- 2FA — discussed and explicitly removed, no code exists for it
- Password change UI — rotate via Render env vars + redeploy
- File uploads — Clients module stores filenames only (v1)
- Real-time messaging — 30-second polling (no WebSockets)
