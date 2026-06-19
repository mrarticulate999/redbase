// CRM companies (prospect/lead firms): CRUD + server-side ICP scoring + recalc.
const express = require('express');
const { body, param, query } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');
const { scoreCompany } = require('../lib/scoring');

const router = express.Router();
router.use(requireAuth);

// Recompute and merge score fields for a company-shaped payload.
async function withScore(data) {
  const cfg = await prisma.scoringConfig.findUnique({ where: { id: 1 } });
  const res = scoreCompany(data, cfg ? cfg.weights : undefined);
  return { priorityScore: res.score, geoTier: res.geoTier, disqualified: res.disqualified };
}

const WRITABLE = [
  'name', 'vertical', 'website', 'domain', 'linkedinUrl', 'state', 'county', 'city',
  'attorneyCount', 'staffCount', 'practiceAreas', 'independent', 'aiAdoptionSignals',
  'triggerEvents', 'leadStatus', 'source', 'owner',
];

router.get(
  '/',
  [
    query('search').optional().isString().trim(),
    query('state').optional().isString().trim(),
    query('leadStatus').optional().isString().trim(),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.state) where.state = req.query.state;
    if (req.query.leadStatus) where.leadStatus = req.query.leadStatus;
    if (req.query.search) {
      const s = req.query.search;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { city: { contains: s, mode: 'insensitive' } },
        { county: { contains: s, mode: 'insensitive' } },
      ];
    }
    const companies = await prisma.company.findMany({ where, orderBy: { priorityScore: 'desc' } });
    res.json({ companies });
  })
);

router.get(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        contacts: true,
        deals: { orderBy: { createdAt: 'desc' } },
        tickets: { orderBy: { openedAt: 'desc' } },
      },
    });
    if (!company) return res.status(404).json({ error: 'Company not found.' });
    res.json({ company });
  })
);

router.post(
  '/',
  [body('name').isString().trim().notEmpty().withMessage('Firm name is required.')],
  handleValidation,
  asyncHandler(async (req, res) => {
    const data = {};
    for (const k of WRITABLE) if (req.body[k] !== undefined) data[k] = req.body[k];
    Object.assign(data, await withScore(data));
    const company = await prisma.company.create({ data });
    res.status(201).json({ company });
  })
);

router.patch(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Company not found.' });
    const data = {};
    for (const k of WRITABLE) if (req.body[k] !== undefined) data[k] = req.body[k];
    Object.assign(data, await withScore({ ...existing, ...data }));
    const company = await prisma.company.update({ where: { id: req.params.id }, data });
    res.json({ company });
  })
);

router.delete(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Company not found.' });
    await prisma.company.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

// Recalculate cached scores for ALL companies (after weight changes).
router.post(
  '/recalculate',
  asyncHandler(async (req, res) => {
    const cfg = await prisma.scoringConfig.findUnique({ where: { id: 1 } });
    const all = await prisma.company.findMany();
    let updated = 0;
    for (const c of all) {
      const r = scoreCompany(c, cfg ? cfg.weights : undefined);
      if (r.score !== c.priorityScore || r.disqualified !== c.disqualified || r.geoTier !== c.geoTier) {
        await prisma.company.update({
          where: { id: c.id },
          data: { priorityScore: r.score, disqualified: r.disqualified, geoTier: r.geoTier },
        });
        updated++;
      }
    }
    res.json({ updated, total: all.length });
  })
);

module.exports = router;
