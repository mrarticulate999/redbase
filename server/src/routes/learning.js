// Security Learning Pathway: tracks, items, per-user progress, completion stats.
const express = require('express');
const { body, param } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// Returns all items grouped by track, each with this user's completion flag and
// team completion counts. Also returns overall individual/team percentages.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [items, userCount, allProgress] = await Promise.all([
      prisma.learningItem.findMany({
        orderBy: [{ track: 'asc' }, { order: 'asc' }],
        include: {
          progress: {
            where: { completed: true },
            select: { userId: true },
          },
        },
      }),
      prisma.user.count(),
      prisma.learningProgress.findMany({
        where: { userId: req.user.id, completed: true },
        select: { learningItemId: true },
      }),
    ]);

    const myCompleted = new Set(allProgress.map((p) => p.learningItemId));

    const tracks = {};
    let teamCompletions = 0;
    for (const item of items) {
      if (!tracks[item.track]) tracks[item.track] = { track: item.track, items: [] };
      const completedByCount = item.progress.length;
      teamCompletions += completedByCount;
      tracks[item.track].items.push({
        id: item.id,
        track: item.track,
        title: item.title,
        description: item.description,
        resourceUrl: item.resourceUrl,
        estimatedHours: item.estimatedHours,
        order: item.order,
        completedByMe: myCompleted.has(item.id),
        completedByCount,
      });
    }

    const totalItems = items.length;
    const individualPct = totalItems > 0 ? Math.round((myCompleted.size / totalItems) * 100) : 0;
    const teamPossible = totalItems * Math.max(userCount, 1);
    const teamPct = teamPossible > 0 ? Math.round((teamCompletions / teamPossible) * 100) : 0;

    res.json({
      tracks: Object.values(tracks),
      stats: { totalItems, individualPct, teamPct, userCount },
    });
  })
);

// Toggle / set completion for the current user on a learning item.
router.put(
  '/:itemId/progress',
  [param('itemId').isUUID(), body('completed').isBoolean()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const item = await prisma.learningItem.findUnique({ where: { id: req.params.itemId } });
    if (!item) return res.status(404).json({ error: 'Learning item not found.' });

    const completed = req.body.completed;
    const progress = await prisma.learningProgress.upsert({
      where: { userId_learningItemId: { userId: req.user.id, learningItemId: item.id } },
      update: { completed, completedAt: completed ? new Date() : null },
      create: {
        userId: req.user.id,
        learningItemId: item.id,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
    res.json({ progress });
  })
);

// Add a new learning resource to a track.
router.post(
  '/',
  [
    body('track').isString().trim().notEmpty().withMessage('Track is required.'),
    body('title').isString().trim().notEmpty().withMessage('Title is required.'),
    body('description').optional().isString().trim(),
    body('resourceUrl').optional().isString().trim(),
    body('estimatedHours').optional().isFloat({ min: 0 }),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const count = await prisma.learningItem.count({ where: { track: b.track } });
    const item = await prisma.learningItem.create({
      data: {
        track: b.track,
        title: b.title,
        description: b.description || '',
        resourceUrl: b.resourceUrl || '',
        estimatedHours: b.estimatedHours != null ? Number(b.estimatedHours) : 1,
        order: count,
      },
    });
    res.status(201).json({ item });
  })
);

module.exports = router;
