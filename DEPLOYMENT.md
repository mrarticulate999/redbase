# REDBASE — Vercel Deployment

REDBASE is an Express + Prisma monolith that also serves the built React client.
On Vercel it runs as:

- **Static site** — the Vite build (`client/dist`) served from Vercel's CDN.
- **One serverless function** — the entire Express API at `api/index.js`. All
  `/api/*` requests are rewritten to it (see `vercel.json`).

The app stays a single repo with a single deploy — a true replacement for Render.

## Files that make this work

| File | Role |
|---|---|
| `vercel.json` | Build command, output dir (`client/dist`), `/api/*` → function rewrite, SPA fallback. |
| `api/index.js` | Imports the Express app (`server/src/index.js`) and exports it as the handler. |
| `server/src/index.js` | Only calls `app.listen()` when run directly (`require.main === module`); on Vercel it's imported, so it never binds a port. |
| `prisma/schema.prisma` | `binaryTargets = ["native", "rhel-openssl-3.0.x"]` so the Prisma engine works on Vercel's Lambda runtime. |

## One-time setup (you do this — no credentials are used here)

1. Push this branch to GitHub.
2. In Vercel → **Add New → Project** → import the `redbase` repo.
3. Framework preset: **Other** (config is already in `vercel.json`; don't override).
4. Add **Environment Variables** (Project → Settings → Environment Variables) — copy
   the values from your current Render dashboard / `.env`:
   - `DATABASE_URL` (Neon **pooled**), `DIRECT_URL` (Neon **direct**)
   - `JWT_SECRET` (>= 32 chars), `JWT_EXPIRES_IN=8h`, `BCRYPT_SALT_ROUNDS=12`
   - `GRANTJ05_PASSWORD`, `ABEHALIM_PASSWORD`, `RJLEE_PASSWORD`
   - `TOKEN_ENCRYPTION_KEY`
   - `CORS_ORIGIN` = your Vercel domain (e.g. `https://redbase.vercel.app`)
   - Optional: `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`, `ANTHROPIC_API_KEY`
   - Leave `VITE_API_BASE_URL` unset (defaults to same-origin `/api`).
5. **Deploy.** Vercel installs root deps, runs `prisma generate`, builds the client.

## Migrations & seeding (run once from your machine, not in the build)

Vercel's build is read-only against the DB; run schema changes against Neon yourself:

```bash
npx prisma migrate deploy        # applies prisma/migrations to Neon
node prisma/seed.js              # founders/users (idempotent)
node prisma/seed-crm.js          # CRM stages/leads (idempotent)
node prisma/seed-learning.js     # learning tracks/modules/items (idempotent)
```

The learning seed uses deterministic IDs, so re-running never wipes a founder's
progress. (These are already applied to the live Neon DB.)

## After Vercel is confirmed green

- Update `GOOGLE_REDIRECT_URI` + the Google Cloud OAuth allowed redirect to the
  Vercel domain.
- Delete `render.yaml` (kept for now as the fallback live deploy until Vercel is verified).

## Known follow-ups

- Rotate the Neon DB password (it was shared in chat previously).
