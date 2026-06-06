// Authenticated encryption (AES-256-GCM) for secrets stored at rest, e.g.
// Google OAuth access/refresh tokens. Values are tagged with a version prefix
// so plaintext (legacy) and encrypted values can coexist during migration.
const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const PREFIX = 'enc:v1:';

function getKey() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex) return null; // no key configured → dev fallback (store plaintext)
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex characters).');
  }
  return key;
}

function encrypt(plain) {
  if (plain == null) return plain;
  const key = getKey();
  if (!key) return plain; // no key → leave as-is (logged as a warning elsewhere)
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(value) {
  if (value == null) return value;
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return value; // plaintext/legacy
  const key = getKey();
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY is required to decrypt stored tokens.');
  const raw = Buffer.from(value.slice(PREFIX.length), 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

function encryptionEnabled() {
  return Boolean(getKey());
}

module.exports = { encrypt, decrypt, encryptionEnabled };
