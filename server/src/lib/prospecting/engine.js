// =============================================================================
// Prospecting engine — keeps the pipeline topped up to a target number of
// ACTIVE qualifying leads (default 100), US-wide but DMV-weighted.
//
// "Active lead" = a Company with leadStatus in (new, working, nurture) that is
// not disqualified. The engine measures the deficit, pulls candidates from the
// configured DataSource, scores each with the shared scoring module, dedups by
// domain, and inserts qualifying firms until the target is met (or it runs out
// of fresh candidates). Every run is logged to ProspectRun.
// =============================================================================

const prisma = require('../prisma');
const { scoreCompany } = require('../scoring');
const { getDataSource } = require('./dataSources');

const ACTIVE_STATUSES = ['new', 'working', 'nurture'];
const TARGET = parseInt(process.env.CRM_LEAD_TARGET || '100', 10);

async function countActiveLeads() {
  return prisma.company.count({
    where: { disqualified: false, leadStatus: { in: ACTIVE_STATUSES } },
  });
}

async function getWeights() {
  const cfg = await prisma.scoringConfig.findUnique({ where: { id: 1 } });
  return cfg ? cfg.weights : undefined;
}

/**
 * Top the pipeline up to `target` active leads.
 * @param {{ target?: number, source?: 'auto'|'clay'|'generated', maxBatches?: number }} opts
 */
async function runProspecting(opts = {}) {
  const target = opts.target || TARGET;
  const ds = getDataSource(opts.source || 'auto');
  const maxBatches = opts.maxBatches || 8;
  const weights = await getWeights();

  const startActive = await countActiveLeads();
  let active = startActive;
  let discovered = 0;
  let qualified = 0;
  let inserted = 0;

  // Known domains for dedup (cheap for our scale).
  const existing = await prisma.company.findMany({ select: { domain: true }, where: { domain: { not: null } } });
  const seen = new Set(existing.map((c) => c.domain));

  let batches = 0;
  while (active < target && batches < maxBatches) {
    batches++;
    const deficit = target - active;
    // Over-fetch: not every candidate qualifies/dedups.
    const candidates = await ds.discover({ count: Math.ceil(deficit * 1.8) + 5 });
    discovered += candidates.length;
    if (candidates.length === 0) break; // async source (e.g. Clay) — results arrive via callback

    for (const c of candidates) {
      if (active >= target) break;
      if (c.domain && seen.has(c.domain)) continue;
      const res = scoreCompany(c, weights);
      if (res.disqualified) continue; // engine maintains QUALIFIED active leads only
      qualified++;
      if (c.domain) seen.add(c.domain);
      await prisma.company.create({
        data: {
          name: c.name,
          vertical: 'law',
          website: c.website || null,
          domain: c.domain || null,
          linkedinUrl: c.linkedinUrl || null,
          state: c.state || null,
          county: c.county || null,
          city: c.city || null,
          attorneyCount: c.attorneyCount ?? null,
          staffCount: c.staffCount ?? null,
          practiceAreas: c.practiceAreas || [],
          independent: c.independent !== false,
          aiAdoptionSignals: c.aiAdoptionSignals || {},
          triggerEvents: c.triggerEvents || [],
          priorityScore: res.score,
          geoTier: res.geoTier,
          disqualified: false,
          leadStatus: 'new',
          source: c.source || ds.name,
          owner: null,
        },
      });
      inserted++;
      active++;
    }
  }

  await prisma.prospectRun.create({
    data: {
      source: ds.name,
      requested: target - startActive > 0 ? target - startActive : 0,
      discovered,
      qualified,
      inserted,
      activeAfter: active,
      note: ds.name === 'clay' && discovered === 0
        ? 'Clay request dispatched; rows will arrive via callback.'
        : `Topped up from ${startActive} to ${active} active leads.`,
    },
  });

  return { startActive, activeAfter: active, discovered, qualified, inserted, source: ds.name, target };
}

module.exports = { runProspecting, countActiveLeads, TARGET, ACTIVE_STATUSES };
