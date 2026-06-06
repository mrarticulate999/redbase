// Client CRM: CRUD, pipeline, notes/history, search & filter.
const express = require('express');
const { body, param, query } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

const STATUSES = ['Lead', 'Active', 'Completed'];

// List clients with optional status/industry filter and free-text search.
router.get(
  '/',
  [
    query('status').optional().isIn(STATUSES),
    query('industry').optional().isString().trim(),
    query('search').optional().isString().trim(),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.industry) where.industry = { equals: req.query.industry, mode: 'insensitive' };
    if (req.query.search) {
      const s = req.query.search;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { contactName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { industry: { contains: s, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ clients });
  })
);

router.get(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: { select: { id: true, title: true, status: true, priority: true } },
        financeEntries: { orderBy: { date: 'desc' } },
      },
    });
    if (!client) return res.status(404).json({ error: 'Client not found.' });
    res.json({ client });
  })
);

const clientBody = [
  body('name').isString().trim().notEmpty().withMessage('Company name is required.'),
  body('contactName').optional().isString().trim(),
  body('email').optional().isEmail().withMessage('Invalid email.'),
  body('phone').optional().isString().trim(),
  body('industry').optional().isString().trim(),
  body('aiSystemType').optional().isString().trim(),
  body('status').optional().isIn(STATUSES),
  body('notes').optional().isString().trim(),
  body('files').optional().isArray(),
  body('files.*').optional().isString().trim(),
];

router.post(
  '/',
  clientBody,
  handleValidation,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const client = await prisma.client.create({
      data: {
        name: b.name,
        contactName: b.contactName || '',
        email: b.email || '',
        phone: b.phone || '',
        industry: b.industry || '',
        aiSystemType: b.aiSystemType || '',
        status: b.status || 'Lead',
        notes: b.notes || '',
        files: b.files || [],
        history: [`${new Date().toISOString()} — Client created by ${req.user.username}`],
      },
    });
    res.status(201).json({ client });
  })
);

router.patch(
  '/:id',
  [param('id').isUUID(), ...clientBody.map((v) => v)],
  handleValidation,
  asyncHandler(async (req, res) => {
    const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Client not found.' });

    const b = req.body;
    const data = {};
    for (const key of ['name', 'contactName', 'email', 'phone', 'industry', 'aiSystemType', 'status', 'notes', 'files']) {
      if (b[key] !== undefined) data[key] = b[key];
    }

    // Log status changes to engagement history.
    if (b.status && b.status !== existing.status) {
      data.history = [
        ...existing.history,
        `${new Date().toISOString()} — Status ${existing.status} → ${b.status} by ${req.user.username}`,
      ];
    }

    const client = await prisma.client.update({ where: { id: req.params.id }, data });
    res.json({ client });
  })
);

// Append a free-text engagement history entry.
router.post(
  '/:id/history',
  [param('id').isUUID(), body('entry').isString().trim().notEmpty()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Client not found.' });
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        history: [
          ...existing.history,
          `${new Date().toISOString()} — ${req.body.entry} (${req.user.username})`,
        ],
      },
    });
    res.json({ client });
  })
);

router.delete(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Client not found.' });
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

module.exports = router;
