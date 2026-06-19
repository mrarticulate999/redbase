// CRM activities / notes / tasks (polymorphic timeline).
const express = require('express');
const { body, param, query } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/',
  [
    query('relatedType').optional().isIn(['company', 'contact', 'deal', 'ticket']),
    query('relatedId').optional().isString(),
    query('type').optional().isString(),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.relatedType) where.relatedType = req.query.relatedType;
    if (req.query.relatedId) where.relatedId = req.query.relatedId;
    if (req.query.type) where.type = req.query.type;
    const activities = await prisma.activity.findMany({
      where,
      orderBy: where.type === 'task' ? { dueAt: 'asc' } : { createdAt: 'desc' },
      take: 500,
    });
    res.json({ activities });
  })
);

router.post(
  '/',
  [
    body('relatedType').isIn(['company', 'contact', 'deal', 'ticket']),
    body('relatedId').isString().notEmpty(),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const activity = await prisma.activity.create({
      data: {
        relatedType: b.relatedType,
        relatedId: b.relatedId,
        type: b.type || 'note',
        body: b.body || '',
        dueAt: b.dueAt ? new Date(b.dueAt) : null,
        completed: !!b.completed,
      },
    });
    res.status(201).json({ activity });
  })
);

router.patch(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const data = {};
    if (b.body !== undefined) data.body = b.body;
    if (b.completed !== undefined) data.completed = b.completed;
    if (b.dueAt !== undefined) data.dueAt = b.dueAt ? new Date(b.dueAt) : null;
    const activity = await prisma.activity.update({ where: { id: req.params.id }, data });
    res.json({ activity });
  })
);

router.delete(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    await prisma.activity.delete({ where: { id: req.params.id } }).catch(() => {});
    res.json({ ok: true });
  })
);

module.exports = router;
