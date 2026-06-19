// CRM contacts (people at firms): CRUD + search.
const express = require('express');
const { body, param, query } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

const WRITABLE = ['companyId', 'firstName', 'lastName', 'title', 'personaRole', 'email', 'phone'];

router.get(
  '/',
  [query('companyId').optional().isUUID(), query('search').optional().isString().trim()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.companyId) where.companyId = req.query.companyId;
    if (req.query.search) {
      const s = req.query.search;
      where.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { title: { contains: s, mode: 'insensitive' } },
      ];
    }
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { id: true, name: true } } },
    });
    res.json({ contacts });
  })
);

router.get(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: { company: { select: { id: true, name: true } } },
    });
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ contact });
  })
);

router.post(
  '/',
  [body('firstName').isString().trim().notEmpty(), body('lastName').isString().trim().notEmpty()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const data = {};
    for (const k of WRITABLE) if (req.body[k] !== undefined) data[k] = req.body[k] || null;
    data.firstName = req.body.firstName;
    data.lastName = req.body.lastName;
    const contact = await prisma.contact.create({ data });
    res.status(201).json({ contact });
  })
);

router.patch(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Contact not found.' });
    const data = {};
    for (const k of WRITABLE) if (req.body[k] !== undefined) data[k] = req.body[k];
    const contact = await prisma.contact.update({ where: { id: req.params.id }, data });
    res.json({ contact });
  })
);

router.delete(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    await prisma.contact.delete({ where: { id: req.params.id } }).catch(() => {});
    res.json({ ok: true });
  })
);

module.exports = router;
