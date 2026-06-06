# REDBASE — Step-by-step setup guide (Windows)

This walks you from your current state to a fully running app. Your repo is at:

```
C:\Users\grant\Downloads\redbase
```

(The README says `C:\Users\grant\redbase`; ignore that — use the `Downloads\redbase` path everywhere below.)

**What's already done for you:** your `.env` exists and has a real `JWT_SECRET`. Backend files are syntax-clean and the React client compiles. You do **not** need to generate a secret or edit `.env` to get started.

---

## Step 0 — Choose your path

There are two ways to run REDBASE. Pick one.

| | **Path A — Docker** (recommended) | **Path B — Local (no Docker)** |
|---|---|---|
| You need | Docker Desktop | Node 20+ **and** PostgreSQL 14+ installed |
| Effort | One command does everything | ~8 commands, 2 terminals |
| Open at | http://localhost:4000 | http://localhost:5173 |
| Good for | "Just get it running" | Active development with hot-reload |

If you have Docker Desktop (or don't mind installing it), use **Path A**. Do Step 1, then jump to Path A.

---

## Step 1 — One-time cleanup (REQUIRED for both paths)

**Why:** while verifying the build, I reinstalled `client\node_modules` with **Linux** binaries. On Windows (Path B) those binaries won't run, and inside the Docker image (Path A) they'd overwrite the container's correct binaries and break the build. You must delete that one folder. A fresh install later recreates it correctly.

**Where:** open a terminal. The simplest is **Command Prompt** — press `Win`, type `cmd`, press Enter.

**What:** run these two lines (the first moves you into the repo, the second deletes the folder):

```cmd
cd C:\Users\grant\Downloads\redbase
rmdir /s /q client\node_modules
```

> Using **PowerShell** instead? The delete command is:
> `Remove-Item -Recurse -Force client\node_modules`

Optional tidy-up (leftover build artifacts from my verification, harmless to keep or delete):

```cmd
rmdir /s /q client\dist
del client\vite.config.js.timestamp-*.mjs
```

Now go to **Path A** or **Path B**.

---

# PATH A — Docker (recommended)

## A1 — Install / confirm Docker Desktop

**What for:** Docker runs PostgreSQL and the app together in containers, so you don't install or configure a database yourself.

- If you don't have it: download **Docker Desktop for Windows** from https://www.docker.com/products/docker-desktop/, install, and launch it.
- Wait until the Docker Desktop whale icon in your system tray is steady (not animating) — that means the engine is running.

Confirm it works (in your terminal):

```cmd
docker --version
docker compose version
```

Both should print a version number. If `docker` is "not recognized," Docker Desktop isn't installed or isn't running yet.

## A2 — Make sure you're in the repo folder

```cmd
cd C:\Users\grant\Downloads\redbase
```

## A3 — Build and start everything

```cmd
docker compose up --build
```

**What this does, in order:** builds the app image (installs backend deps, generates the Prisma client, installs client deps and builds the React bundle), starts a PostgreSQL container, waits for it to be healthy, runs database migrations (`prisma migrate deploy`), seeds the starter users and sample data, then starts the API which also serves the built website.

**When:** the first run takes **several minutes** (downloading images + building). Later runs are much faster.

**What success looks like:** the logs settle and you see a line like:

```
REDBASE API listening on http://localhost:4000
```

Leave this terminal open — it's running the app. Closing it or pressing `Ctrl+C` stops the app.

## A4 — Open the app and log in

In your browser go to:

```
http://localhost:4000
```

Log in with a seeded account:

| Username | Password | Role |
|---|---|---|
| admin | password123 | admin |
| operator1 | password123 | operator |
| operator2 | password123 | operator |

→ Continue to **"First login"** near the bottom.

## A5 — Stopping, restarting, resetting (Docker)

- **Stop:** press `Ctrl+C` in the terminal, or in a second terminal run `docker compose down` (containers stop; your database data is kept in a volume).
- **Start again later:** `docker compose up` (no `--build` needed unless you changed code).
- **Wipe the database and start clean:** `docker compose down -v` (the `-v` deletes the data volume), then `docker compose up --build`.

---

# PATH B — Local (no Docker)

Use this if you'd rather not use Docker, or you want hot-reloading while developing. You'll run the API and the website as two separate processes.

## B1 — Install Node.js 20+

**What for:** runs both the backend and the build tooling.

- Download the **LTS** installer from https://nodejs.org/ and install it.
- Confirm (new terminal):

```cmd
node --version
```

It should print `v20.x` or higher.

## B2 — Install and start PostgreSQL 14+, then create the database

**What for:** REDBASE stores all data in Postgres. Your `.env` expects a database reachable at:

```
postgresql://redbase:redbase@localhost:5432/redbase
```

So you need a Postgres server on `localhost:5432` with a **user** `redbase` (password `redbase`) and a **database** `redbase`.

1. Download **PostgreSQL** from https://www.postgresql.org/download/windows/ and run the installer. When asked, set a password for the default `postgres` superuser and **keep the port as `5432`**. Let it install **pgAdmin** too (a GUI), which makes the next part easy.
2. Create the user and database. Easiest with the included **SQL Shell (psql)** — open it from the Start menu, accept the defaults, and enter the `postgres` password you set. Then paste:

```sql
CREATE ROLE redbase WITH LOGIN PASSWORD 'redbase';
CREATE DATABASE redbase OWNER redbase;
```

   You should see `CREATE ROLE` and `CREATE DATABASE`. Type `\q` to exit.

> If you prefer different credentials, change them here **and** update `DATABASE_URL` in `C:\Users\grant\Downloads\redbase\.env` to match.

## B3 — Install backend dependencies

In your terminal, in the repo root:

```cmd
cd C:\Users\grant\Downloads\redbase
npm install
```

**What for:** installs Express, Prisma, auth libraries, etc., and generates the Prisma client for your machine.

## B4 — Install frontend dependencies

```cmd
npm run client:install
```

**What for:** installs React/Vite and recreates the `client\node_modules` you deleted in Step 1 — this time with correct Windows binaries.

## B5 — Create the database schema

```cmd
npx prisma migrate dev --name init
```

**What for:** reads `prisma\schema.prisma` and creates all the tables in your `redbase` database. Because there's no migrations folder yet, this also generates the first migration. You should see "Your database is now in sync with your schema."

> If this errors with a connection problem, Postgres isn't running or the credentials in `.env` don't match Step B2.

## B6 — Seed starter data

```cmd
npm run seed
```

**What for:** inserts the three login accounts (table above) plus the learning tracks and sample data so the dashboard isn't empty.

## B7 — Start the API (Terminal 1)

```cmd
npm run dev
```

**What for:** starts the Express backend. Leave this terminal running. Success looks like:

```
REDBASE API listening on http://localhost:4000
```

Quick check (optional): open http://localhost:4000/api/health — you should see `{"status":"ok",...}`.

## B8 — Start the website (Terminal 2)

Open a **second** terminal (the first one is busy running the API):

```cmd
cd C:\Users\grant\Downloads\redbase
npm run client:dev
```

**What for:** starts the Vite dev server for the React UI on port 5173. It automatically forwards `/api` calls to the backend on port 4000, so the two work together. Leave this running too.

## B9 — Open the app and log in

```
http://localhost:5173
```

Log in with `admin` / `password123` (full table above).

## Stopping (local)

Press `Ctrl+C` in each of the two terminals. To start again next time, just repeat **B7** and **B8** (you don't need to reinstall or re-migrate unless the schema changed).

---

## First login (both paths)

1. Log in as **admin / password123**.
2. Click through the modules in the sidebar — Calendar, Communications, Tasks, Finance, Learning, Clients — to confirm they load.
3. **Change the seeded passwords immediately.** They're public knowledge from the README, so anyone who reaches your instance could log in. Change them from the user/account area in the app before exposing this to anyone.

---

## Optional — Google Calendar

The Calendar module shows a "not configured" state until you add Google OAuth credentials. **Everything else works without it.** If you want live calendar data, follow **README section 4**: create an OAuth client in Google Cloud Console with redirect URI `http://localhost:4000/api/calendar/oauth/callback`, then paste `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` into `.env` and restart. You can do this anytime later.

---

## Troubleshooting

**"port is already allocated" / `EADDRINUSE` on 4000 or 5432**
Something else is using that port (often a previous run). Close the old terminal/container, or find and stop the process: `netstat -ano | findstr :4000` then `taskkill /PID <pid> /F`.

**Login returns "Too many requests" (HTTP 429)**
The login endpoint is rate-limited to 5 attempts per 15 minutes per IP (a security feature). Wait 15 minutes, or restart the API to reset it.

**(Local) `prisma migrate` can't reach the database**
Postgres isn't running, the port isn't 5432, or the user/password/db don't match `DATABASE_URL` in `.env`. Re-check Step B2.

**(Docker) build fails inside `client`**
Make sure you did **Step 1** — a leftover `client\node_modules` is the usual cause.

**Blank page or API calls failing in the browser**
Confirm both processes are up (Path B needs *both* terminals running), and that you opened the right URL: **4000** for Docker, **5173** for local dev.

**`docker` not recognized**
Docker Desktop isn't installed or isn't started — launch it and wait for the tray icon to stop animating.
