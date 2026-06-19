// CRM support tickets.
const express = require('express');
const { body, param } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.companyId) where.companyId = req.query.companyId;
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      include: { company: { select: { id: true, name: true } } },
    });
    res.json({ tickets });
  })
);

router.post(
  '/',
  [body('subject').isString().trim().notEmpty()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const ticket = await prisma.ticket.create({
      data: {
        companyId: b.companyId || null,
        contactId: b.contactId || null,
        subject: b.subject,
        status: b.status || 'open',
        priority: b.priority || 'medium',
        assignee: b.assignee || null,
        resolutionNotes: b.resolutionNotes || null,
      },
    });
    res.status(201).json({ ticket });
  })
);

router.patch(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const data = {};
    for (const k of ['subject', 'status', 'priority', 'assignee', 'resolutionNotes']) if (b[k] !== undefined) data[k] = b[k];
    if (b.status === 'resolved' || b.status === 'closed') data.resolvedAt = new Date();
    if (b.status === 'open' || b.status === 'pending') data.resolvedAt = null;
    const ticket = await prisma.ticket.update({ where: { id: req.params.id }, data });
    res.json({ ticket });
  })
);

router.delete(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    await prisma.ticket.delete({ where: { id: req.params.id } }).catch(() => {});
    res.json({ ok: true });
  })
);

module.exports = router;
