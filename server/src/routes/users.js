// Team roster — used for @mentions, task assignees, and learning leaderboards.
const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true },
      orderBy: { username: 'asc' },
    });
    res.json({ users });
  })
);

module.exports = router;
