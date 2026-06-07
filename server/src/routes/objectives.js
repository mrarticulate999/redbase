const express = require('express');
const { body, param } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const objectives = await prisma.objective.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      keyResults: { orderBy: { createdAt: 'asc' } },
      user: { select: { username: true } },
    },
  });
  res.json(objectives);
}));

router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('timeframe').isIn(['quarterly', 'annual']).withMessage('Timeframe must be quarterly or annual'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { title, timeframe, status } = req.body;
    const objective = await prisma.objective.create({
      data: {
        title,
        timeframe,
        status: status || 'active',
        userId: req.user.id,
      },
      include: { keyResults: true, user: { select: { username: true } } },
    });
    res.status(201).json(objective);
  })
);

router.patch('/:id',
  [param('id').isUUID()],
  validate,
  asyncHandler(async (req, res) => {
    const { title, timeframe, status } = req.body;
    const objective = await prisma.objective.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(timeframe !== undefined && { timeframe }),
        ...(status !== undefined && { status }),
      },
      include: { keyResults: true, user: { select: { username: true } } },
    });
    res.json(objective);
  })
);

router.delete('/:id',
  [param('id').isUUID()],
  validate,
  asyncHandler(async (req, res) => {
    await prisma.objective.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

// Key Results sub-resource
router.post('/:id/results',
  [
    param('id').isUUID(),
    body('title').trim().notEmpty(),
    body('target').isFloat({ min: 0 }),
    body('unit').optional().trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { title, target, unit, current } = req.body;
    const kr = await prisma.keyResult.create({
      data: {
        title,
        target: parseFloat(target),
        current: current ? parseFloat(current) : 0,
        unit: unit || '%',
        objectiveId: req.params.id,
      },
    });
    res.status(201).json(kr);
  })
);

router.patch('/results/:krId',
  [param('krId').isUUID()],
  validate,
  asyncHandler(async (req, res) => {
    const { title, target, current, unit } = req.body;
    const kr = await prisma.keyResult.update({
      where: { id: req.params.krId },
      data: {
        ...(title !== undefined && { title }),
        ...(target !== undefined && { target: parseFloat(target) }),
        ...(current !== undefined && { current: parseFloat(current) }),
        ...(unit !== undefined && { unit }),
      },
    });
    res.json(kr);
  })
);

router.delete('/results/:krId',
  [param('krId').isUUID()],
  validate,
  asyncHandler(async (req, res) => {
    await prisma.keyResult.delete({ where: { id: req.params.krId } });
    res.json({ ok: true });
  })
);

module.exports = router;
