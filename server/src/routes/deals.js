// CRM deals: pipeline CRUD. Probability is derived from the stage on write.
const express = require('express');
const { body, param } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// Prisma Decimal -> number so client forecast math is plain arithmetic.
const ser = (d) => (d ? { ...d, amount: d.amount != null ? Number(d.amount) : 0 } : d);

async function probabilityForStage(stage) {
  const s = await prisma.pipelineStage.findUnique({ where: { key: stage } });
  return s ? s.probability : 5;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.companyId) where.companyId = req.query.companyId;
    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { id: true, name: true } } },
    });
    res.json({ deals: deals.map(ser) });
  })
);

router.post(
  '/',
  [body('name').isString().trim().notEmpty(), body('companyId').optional().isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const stage = b.stage || 'new';
    const deal = await prisma.deal.create({
      data: {
        companyId: b.companyId || null,
        name: b.name,
        serviceType: b.serviceType || 'posture_assessment',
        stage,
        amount: b.amount != null ? b.amount : 0,
        probability: await probabilityForStage(stage),
        expectedClose: b.expectedClose ? new Date(b.expectedClose) : null,
        source: b.source || null,
        owner: b.owner || null,
      },
    });
    res.status(201).json({ deal: ser(deal) });
  })
);

router.patch(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const existing = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Deal not found.' });
    const b = req.body;
    const data = {};
    for (const k of ['name', 'serviceType', 'amount', 'source', 'owner']) if (b[k] !== undefined) data[k] = b[k];
    if (b.expectedClose !== undefined) data.expectedClose = b.expectedClose ? new Date(b.expectedClose) : null;
    if (b.stage !== undefined) {
      data.stage = b.stage;
      data.probability = await probabilityForStage(b.stage);
    }
    const deal = await prisma.deal.update({ where: { id: req.params.id }, data });
    res.json({ deal: ser(deal) });
  })
);

router.delete(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    await prisma.deal.delete({ where: { id: req.params.id } }).catch(() => {});
    res.json({ ok: true });
  })
);

module.exports = router;
