// CRM control plane: stages, segments, scoring config, prospecting engine,
// Clay enrichment callback, and dashboard aggregates.
const express = require('express');
const { body, param } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');
const { scoreCompany } = require('../lib/scoring');
const { runProspecting, countActiveLeads, TARGET, ACTIVE_STATUSES } = require('../lib/prospecting/engine');

const router = express.Router();

// ---------------- stages ----------------
router.get('/stages', requireAuth, asyncHandler(async (req, res) => {
  res.json({ stages: await prisma.pipelineStage.findMany({ orderBy: { position: 'asc' } }) });
}));
router.patch('/stages/:id', requireAuth, [param('id').isUUID()], handleValidation, asyncHandler(async (req, res) => {
  const data = {};
  for (const k of ['label', 'probability', 'position']) if (req.body[k] !== undefined) data[k] = req.body[k];
  const stage = await prisma.pipelineStage.update({ where: { id: req.params.id }, data });
  res.json({ stage });
}));

// ---------------- segments ----------------
router.get('/segments', requireAuth, asyncHandler(async (req, res) => {
  res.json({ segments: await prisma.segment.findMany({ orderBy: { createdAt: 'desc' } }) });
}));
router.post('/segments', requireAuth, [body('name').isString().trim().notEmpty()], handleValidation, asyncHandler(async (req, res) => {
  const segment = await prisma.segment.create({ data: { name: req.body.name, filterJson: req.body.filterJson || {} } });
  res.status(201).json({ segment });
}));
router.delete('/segments/:id', requireAuth, [param('id').isUUID()], handleValidation, asyncHandler(async (req, res) => {
  await prisma.segment.delete({ where: { id: req.params.id } }).catch(() => {});
  res.json({ ok: true });
}));

// ---------------- scoring config ----------------
router.get('/scoring-config', requireAuth, asyncHandler(async (req, res) => {
  const cfg = await prisma.scoringConfig.findUnique({ where: { id: 1 } });
  res.json({ config: cfg });
}));
router.patch('/scoring-config', requireAuth, asyncHandler(async (req, res) => {
  const cfg = await prisma.scoringConfig.upsert({
    where: { id: 1 },
    update: { weights: req.body.weights },
    create: { id: 1, weights: req.body.weights },
  });
  res.json({ config: cfg });
}));

// ---------------- prospecting engine ----------------
router.get('/prospecting/status', requireAuth, asyncHandler(async (req, res) => {
  const [active, runs, total] = await Promise.all([
    countActiveLeads(),
    prisma.prospectRun.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.company.count(),
  ]);
  const clayConfigured = !!process.env.CLAY_WEBHOOK_URL;
  res.json({ active, target: TARGET, deficit: Math.max(0, TARGET - active), totalCompanies: total, runs, clayConfigured });
}));

router.post('/prospecting/run', requireAuth, asyncHandler(async (req, res) => {
  const result = await runProspecting({ target: req.body.target, source: req.body.source || 'auto' });
  res.json({ result });
}));

// Clay enrichment callback — Clay posts enriched firm rows here. Unauthenticated
// (Clay can't carry a JWT) but gated by a shared secret. Configure CLAY_CALLBACK_SECRET.
router.post('/prospecting/clay-callback', asyncHandler(async (req, res) => {
  const secret = process.env.CLAY_CALLBACK_SECRET;
  if (secret && req.get('x-clay-secret') !== secret) return res.status(401).json({ error: 'Bad callback secret.' });
  const rows = Array.isArray(req.body) ? req.body : req.body.rows || [];
  const cfg = await prisma.scoringConfig.findUnique({ where: { id: 1 } });
  let inserted = 0;
  for (const r of rows) {
    if (!r.domain) continue;
    const exists = await prisma.company.findUnique({ where: { domain: r.domain } });
    if (exists) continue;
    const cand = {
      name: r.name, website: r.website || (r.domain ? `https://${r.domain}` : null), domain: r.domain,
      state: r.state, county: r.county, city: r.city, attorneyCount: r.attorneyCount,
      staffCount: r.staffCount, practiceAreas: r.practiceAreas || [], independent: r.independent !== false,
      aiAdoptionSignals: r.aiAdoptionSignals || {}, triggerEvents: r.triggerEvents || [],
    };
    const score = scoreCompany(cand, cfg ? cfg.weights : undefined);
    if (score.disqualified) continue;
    await prisma.company.create({
      data: { ...cand, vertical: 'law', priorityScore: score.score, geoTier: score.geoTier,
        disqualified: false, leadStatus: 'new', source: 'clay' },
    });
    inserted++;
  }
  res.json({ inserted });
}));

// ---------------- dashboard aggregates ----------------
router.get('/dashboard', requireAuth, asyncHandler(async (req, res) => {
  const [deals, stages, tickets, companies, tasks, acts, active] = await Promise.all([
    prisma.deal.findMany({ include: { company: { select: { name: true } } } }),
    prisma.pipelineStage.findMany({ orderBy: { position: 'asc' } }),
    prisma.ticket.findMany(),
    prisma.company.findMany(),
    prisma.activity.findMany({ where: { type: 'task', completed: false }, orderBy: { dueAt: 'asc' }, take: 8 }),
    prisma.activity.findMany({ take: 500 }),
    countActiveLeads(),
  ]);
  const amt = (d) => Number(d.amount || 0);
  const openDeals = deals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
  const won = deals.filter((d) => d.stage === 'closed_won');
  const lost = deals.filter((d) => d.stage === 'closed_lost');
  const weighted = openDeals.reduce((s, d) => s + amt(d) * (d.probability / 100), 0);

  const byStage = stages.map((s) => ({ key: s.key, label: s.label, value: deals.filter((d) => d.stage === s.key).reduce((a, d) => a + amt(d), 0) }));
  const sourceMap = {}; deals.forEach((d) => { const k = d.source || 'unknown'; sourceMap[k] = (sourceMap[k] || 0) + 1; });
  const actMap = {}; acts.forEach((a) => { actMap[a.type] = (actMap[a.type] || 0) + 1; });
  const geoMap = {}; companies.forEach((c) => { geoMap[c.geoTier] = (geoMap[c.geoTier] || 0) + 1; });
  const hotLeads = companies.filter((c) => !c.disqualified).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 6);

  res.json({
    metrics: {
      weightedForecast: Math.round(weighted),
      openPipeline: openDeals.reduce((s, d) => s + amt(d), 0),
      wonValue: won.reduce((s, d) => s + amt(d), 0),
      openDeals: openDeals.length,
      winRate: won.length + lost.length > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0,
      openTickets: tickets.filter((t) => t.status === 'open' || t.status === 'pending').length,
      activeLeads: active,
      leadTarget: TARGET,
      totalCompanies: companies.length,
    },
    byStage,
    bySource: Object.entries(sourceMap).map(([name, value]) => ({ name, value })),
    byActivity: Object.entries(actMap).map(([name, value]) => ({ name, value })),
    byGeo: Object.entries(geoMap).map(([name, value]) => ({ name, value })),
    ticketsByStatus: ['open', 'pending', 'resolved', 'closed'].map((s) => ({ name: s, value: tickets.filter((t) => t.status === s).length })),
    tasks,
    hotLeads,
  });
}));

module.exports = router;
