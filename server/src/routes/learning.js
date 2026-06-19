// Learning section — four roadmap tracks (Track → Module → Item) with
// per-founder progress and goals. All authenticated founders can READ everyone's
// progress; each can only WRITE their own (enforced via req.user.id, never a
// client-supplied member id).
const express = require('express');
const { body, param } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// Friendly display names for the founders (falls back to username).
const DISPLAY_NAMES = {
  grantj05: 'Grant',
  abehalim: 'Abe',
  rjlee: 'Remington',
};
const displayName = (username) => DISPLAY_NAMES[username] || username;

// Full learning state: tracks + nested modules/items, the founder roster,
// every member's completed item ids, and all goals.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [tracks, members, progress, goals] = await Promise.all([
      prisma.learningTrack.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          modules: {
            orderBy: { sortOrder: 'asc' },
            include: { items: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      }),
      prisma.user.findMany({ select: { id: true, username: true }, orderBy: { createdAt: 'asc' } }),
      prisma.learningProgress.findMany({
        where: { completed: true },
        select: { userId: true, itemId: true },
      }),
      prisma.learningGoal.findMany({
        select: { userId: true, trackId: true, targetDate: true, note: true },
      }),
    ]);

    // progressByMember: { [userId]: [itemId, ...] }
    const progressByMember = {};
    for (const m of members) progressByMember[m.id] = [];
    for (const p of progress) {
      (progressByMember[p.userId] ||= []).push(p.itemId);
    }

    res.json({
      me: req.user.id,
      members: members.map((m) => ({
        id: m.id,
        username: m.username,
        name: displayName(m.username),
      })),
      tracks,
      progressByMember,
      goals,
    });
  })
);

// Set completion for the CURRENT user on an item (write-your-own only).
router.put(
  '/items/:itemId/progress',
  [param('itemId').isString().notEmpty(), body('completed').isBoolean()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const item = await prisma.learningItem.findUnique({ where: { id: req.params.itemId } });
    if (!item) return res.status(404).json({ error: 'Learning item not found.' });

    const completed = req.body.completed;
    const progress = await prisma.learningProgress.upsert({
      where: { userId_itemId: { userId: req.user.id, itemId: item.id } },
      update: { completed, completedAt: completed ? new Date() : null },
      create: {
        userId: req.user.id,
        itemId: item.id,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
    res.json({ progress });
  })
);

// Set / clear the CURRENT user's goal for a track (target date + optional note).
router.put(
  '/goals/:trackId',
  [
    param('trackId').isString().notEmpty(),
    body('targetDate').optional({ nullable: true }).isISO8601(),
    body('note').optional({ nullable: true }).isString().trim(),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const track = await prisma.learningTrack.findUnique({ where: { id: req.params.trackId } });
    if (!track) return res.status(404).json({ error: 'Track not found.' });

    const targetDate = req.body.targetDate ? new Date(req.body.targetDate) : null;
    const note = req.body.note || '';
    const goal = await prisma.learningGoal.upsert({
      where: { userId_trackId: { userId: req.user.id, trackId: track.id } },
      update: { targetDate, note },
      create: { userId: req.user.id, trackId: track.id, targetDate, note },
    });
    res.json({ goal });
  })
);

module.exports = router;
