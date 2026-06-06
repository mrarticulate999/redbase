# REDBASE

Internal operations dashboard for a 3-person AI red teaming & prompt-injection consultancy.

Modules: **Google Calendar · Team Communications · Tasks (Kanban) · Finance · Security Learning Pathway · Clients (CRM)**.

- **Frontend:** React + Vite + Tailwind CSS (dark mode, mobile-responsive, React Router v6)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Native JWT (8h expiry) + bcrypt (12 salt rounds) — no third-party auth
- **Security:** Helmet, CORS allow-list, express-validator input sanitization, login rate limiting (5 / 15 min), parameterized queries

---

## 1. Prerequisites

- **Node.js 20+**
- **PostgreSQL 14+** running locally, *or* Docker Desktop (compose file provided)

---

## 2. Quick start (local, with your own Postgres)

```bash
# from the repo root: C:\Users\grant\redbase

# 1. Install backend deps
npm install

# 2. Install frontend deps
npm run client:install

# 3. Create your .env from the template and fill in values
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux

#    -> at minimum set DATABASE_URL and JWT_SECRET
#    generate a JWT secret:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Create the schema + seed users/sample data
npx prisma migrate dev --name init
npm run seed

# 5. Run the API (terminal 1)
npm run dev          # http://localhost:4000

# 6. Run the client (terminal 2)
npm run client:dev   # http://localhost:5173
```

Open **http://localhost:5173** and log in.

### Seeded accounts

| Username   | Password      | Role     |
|------------|---------------|----------|
| admin      | password123   | admin    |
| operator1  | password123   | operator |
| operator2  | password123   | operator |

> Change these immediately for any real deployment.

---

## 3. Quick start (Docker — Postgres + app in one shot)

```bash
copy .env.example .env        # set JWT_SECRET (and Google vars if using Calendar)
docker compose up --build
```

This starts Postgres, runs migrations, seeds data, builds the React client, and serves
everything from the API container at **http://localhost:4000**.

---

## 4. Google Calendar OAuth setup

The Calendar module uses OAuth2 with **read-only** calendar scopes. Without these
credentials the module renders a "not configured" state; everything else works.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → create/select a project.
2. **APIs & Services → Library →** enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen:**
   - User type: **External** (or Internal for a Workspace org).
   - Add your team members as **Test users**.
   - Scopes: `.../auth/calendar.readonly` and `.../auth/calendar.events.readonly`.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID:**
   - Application type: **Web application**.
   - **Authorized redirect URI:** `http://localhost:4000/api/calendar/oauth/callback`
     (use your production API URL in prod, e.g. `https://api.yourdomain.com/api/calendar/oauth/callback`).
5. Copy the **Client ID** and **Client Secret** into `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=http://localhost:4000/api/calendar/oauth/callback
   ```
6. Restart the API. In the app, open **Calendar → Connect Google Calendar**.
   Each team member connects their own Google account; tokens are stored per-user,
   server-side, in the `GoogleToken` table (refresh tokens are used to auto-renew).

---

## 5. Environment variables

See [`.env.example`](.env.example) for the full annotated list. Key ones:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | **Required.** Signing secret for JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (default `8h`) |
| `BCRYPT_SALT_ROUNDS` | Password hash cost (default `12`) |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins |
| `PORT` | API port (default `4000`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Calendar OAuth |
| `VITE_API_BASE_URL` | Client → API base (default `/api`, proxied in dev) |

---

## 6. Project structure

```
redbase/
├─ prisma/
│  ├─ schema.prisma        # all models
│  └─ seed.js              # users, learning tracks, sample data
├─ server/
│  └─ src/
│     ├─ index.js          # Express app + middleware + route mounting
│     ├─ lib/              # prisma client, auth helpers, async wrapper
│     ├─ middleware/       # JWT auth + validation
│     └─ routes/           # auth, users, messages, tasks, clients, finance, learning, calendar
├─ client/
│  └─ src/
│     ├─ App.jsx           # routes
│     ├─ context/          # AuthContext (JWT lifecycle)
│     ├─ components/       # Layout, Sidebar, ProtectedRoute, shared UI
│     └─ pages/            # one component per module + Login
├─ .env.example
├─ docker-compose.yml
├─ Dockerfile
└─ package.json            # backend + prisma scripts
```

---

## 7. NPM scripts (root)

| Script | Action |
|--------|--------|
| `npm run dev` | Start the API |
| `npm run server:dev` | Start the API with nodemon (auto-reload) |
| `npm run client:dev` | Start the Vite dev server |
| `npm run seed` | Run the seed script |
| `npm run setup` | `prisma generate` + `migrate deploy` + seed |
| `npm run build` | Install + build the client, generate Prisma client |
| `npm run prisma:migrate` | Create/apply a dev migration |

---

## 8. Deployment (Railway / Render / Fly.io)

The app is reverse-proxy/HTTPS-ready (`trust proxy` is enabled; TLS terminates at the proxy).

1. Provision a managed Postgres; set `DATABASE_URL`.
2. Set all secrets from `.env.example` as environment variables (especially `JWT_SECRET`,
   `CORS_ORIGIN` = your frontend URL, and the Google vars).
3. Build command: `npm install && npm run build`
4. Release/pre-deploy command: `npx prisma migrate deploy && npm run seed`
   (run the seed only once, or rely on its idempotency).
5. Start command: `npm start`
6. Update the Google OAuth **Authorized redirect URI** to your production callback URL.

The Express server serves the built client from `client/dist` when `NODE_ENV=production`,
so a single service can host both API and UI.

---

## 9. Security notes

- All `/api/*` routes except `/api/auth/login` and the OAuth callback require a valid JWT.
- Passwords are bcrypt-hashed (cost 12); plaintext is never stored or logged.
- Login is rate-limited to 5 attempts per 15 minutes per IP.
- All write endpoints validate & sanitize input with express-validator.
- CORS is restricted to the origins in `CORS_ORIGIN`.
- Prisma parameterizes every query (no string-built SQL).
- Google tokens are stored server-side per user and never exposed to the client.
```
