// Auth helpers: password hashing + JWT sign/verify.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Refusing to sign/verify tokens.');
  }
  return secret;
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(user) {
  // Only embed non-sensitive identity claims.
  const payload = { sub: user.id, username: user.username, role: user.role };
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
