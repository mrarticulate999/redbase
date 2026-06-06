// Authentication routes: login, current user, logout.
const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const prisma = require('../lib/prisma');
const { verifyPassword, signToken } = require('../lib/auth');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// Max 5 login attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post(
  '/login',
  loginLimiter,
  [
    body('username').isString().trim().notEmpty().withMessage('Username is required.'),
    body('password').isString().notEmpty().withMessage('Password is required.'),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    // Constant-ish response regardless of which factor failed.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  })
);

// Returns the authenticated user's profile (token validity check).
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user });
  })
);

// JWT is stateless — logout is handled client-side by discarding the token.
// Endpoint exists so the client can call it uniformly.
router.post('/logout', requireAuth, (req, res) => {
  return res.json({ ok: true });
});

module.exports = router;
