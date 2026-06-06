# REDBASE — Security Posture

This documents the controls in place and the actions only you (the operators) can take.
REDBASE is an internal tool for a 3-person team; the model below is "trusted small team,
hardened against external attackers and data leaks."

## Controls in place

### Authentication & sessions
- Passwords hashed with **bcrypt** (cost 12). Plaintext is never stored or logged.
- **No default/shared passwords.** Each account's password comes from an environment
  variable (`ADMIN_PASSWORD`, `OPERATOR1_PASSWORD`, `OPERATOR2_PASSWORD`). The seed will
  **not** silently reset an existing user's password — it only changes one when you
  deliberately set/rotate its env var.
- **JWT** sessions, 8-hour expiry, signed with `JWT_SECRET`. The server **refuses to start**
  if `JWT_SECRET` is missing or shorter than 32 characters.
- Login returns identical errors for "no such user" and "wrong password" (no account
  enumeration).

### Network / transport
- **Rate limiting:** login is capped at 5 attempts / 15 min per IP; the whole API is
  capped at 600 requests / 15 min per IP (brute-force / scraping / DoS protection).
- **CORS** restricted to the origins in `CORS_ORIGIN`.
- **HSTS** (1 year) forces HTTPS in production; TLS terminates at the Render proxy.
- `trust proxy` is set to 1 hop so client IPs (for rate limiting) are read correctly
  behind the proxy without being spoofable.

### Application headers (Helmet)
- **Content-Security-Policy** in production: scripts/styles/images restricted to same
  origin (styles allow inline for React/Recharts only), `frame-ancestors 'none'`
  (clickjacking), `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
  `Referrer-Policy: no-referrer`, `X-Powered-By` removed.

### Data protection
- **Google OAuth tokens are encrypted at rest** (AES-256-GCM) using
  `TOKEN_ENCRYPTION_KEY`. A database leak does not expose usable calendar access.
- All DB access goes through **Prisma** (parameterized queries — no SQL injection).
- Inputs validated/sanitized with **express-validator** on every write endpoint;
  JSON bodies capped at 1 MB.
- API responses never include password hashes or OAuth tokens. `/api/users` exposes
  only id/username/role.
- Authorization tokens are sent as `Authorization: Bearer` headers (not cookies), so
  classic CSRF does not apply.

### Dependencies
- `npm audit` is clean (**0 vulnerabilities**) as of the last hardening pass.
  bcrypt v6 and googleapis v173 removed the previously-flagged transitive issues.

## Actions only you can take

1. **Rotate the Neon database password.** The connection string was shared during setup.
   In the Neon dashboard → Roles → reset the password, then update `DATABASE_URL` and
   `DIRECT_URL` in your local `.env` and in Render.
2. **Set the account passwords & encryption key in Render** (Environment tab), values
   provided to you separately. Never commit them; `.env` is gitignored.
3. **Keep `TOKEN_ENCRYPTION_KEY` stable.** Changing it makes previously-stored Google
   tokens undecryptable (users would just reconnect Calendar).
4. **Rotate JWT_SECRET** if you suspect compromise — it invalidates all active sessions.
5. **Run `npm audit` periodically** and patch.

## Known limitations (acceptable for a trusted 3-person team)
- No per-record ownership checks on tasks/clients/finance — any authenticated teammate
  can edit/delete any record (messages are author/admin-only). Appropriate for a small
  trusted team; revisit if the team grows.
- JWT is stored in the browser's `localStorage`. The app renders all user content as
  text (React escaping; no `dangerouslySetInnerHTML`), so XSS exposure is low, but a
  future move to httpOnly cookies would further harden against token theft.
- No 2FA (descoped by request). TOTP could be added later if needed.

## Reporting
Found something? Contact the admin directly — do not file it in the public repo.
