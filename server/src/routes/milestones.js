const express = require('express');
const { body, param } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const milestones = await prisma.milestone.findMany({
    orderBy: { date: 'asc' },
    include: { user: { select: { username: true } } },
  });
  res.json(milestones);
}));

router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('timeframe').isIn(['short', 'mid', 'long']).withMessage('Timeframe must be short, mid, or long'),
    body('description').optional().trim(),
    body('status').optional().isIn(['planned', 'in-progress', 'done']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { title, date, category, timeframe, description, status } = req.body;
    const milestone = await prisma.milestone.create({
      data: {
        title,
        date: new Date(date),
        category,
        timeframe,
        description: description || '',
        status: status || 'planned',
        userId: req.user.id,
      },
      include: { user: { select: { username: true } } },
    });
    res.status(201).json(milestone);
  })
);

router.patch('/:id',
  [param('id').isUUID()],
  validate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.milestone.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Milestone not found.' });

    const { title, date, category, timeframe, description, status } = req.body;
    const milestone = await prisma.milestone.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(category !== undefined && { category }),
        ...(timeframe !== undefined && { timeframe }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
      include: { user: { select: { username: true } } },
    });
    res.json(milestone);
  })
);

router.delete('/:id',
  [param('id').isUUID()],
  validate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.milestone.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Milestone not found.' });
    await prisma.milestone.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

module.exports = router;
