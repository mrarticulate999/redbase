// =============================================================================
// CloudGuard Lead-Scoring Module  —  SINGLE SOURCE OF TRUTH for ICP logic
// (CommonJS port of the standalone CRM's scoring.ts, shared by the API routes,
//  the prospecting engine, and the seed.)
// -----------------------------------------------------------------------------
// Beachhead ICP: DMV INDEPENDENT law firms, 10–75 attorneys, in high-data-
// sensitivity / AI-adopting practice areas with no internal security function.
// Prospecting is US-wide but DMV-weighted: geography is GRADUATED so the closer
// a firm is to the DMV, the higher it scores.
//
// Tune via the scoring_config row (Settings → Lead-score weights) — weights are
// passed in; DEFAULT_WEIGHTS is the fallback / shape reference.
// =============================================================================

const DEFAULT_WEIGHTS = {
  geography: { dmv_core: 22, dmv_state: 14, adjacent: 7, us: 0 },
  firmographic: { size_in_range: 15, independent: 10 },
  practice_area: { high_security: 20, automation_upsell: 8 },
  ai_signal_each: 8,
  ai_signal_max: 32,
  trigger_event_each: 6,
  trigger_event_max: 18,
  size: { min_attorneys: 10, max_attorneys: 75 },
};

// DMV in-territory jurisdictions (full points).
const DMV_CORE = {
  DC: ['*'],
  MD: ['montgomery', "prince george's", 'prince georges', 'howard', 'anne arundel', 'baltimore'],
  VA: ['arlington', 'alexandria', 'fairfax', 'loudoun', 'prince william'],
};
// States bordering / near the DMV — partial geo credit ("closer is better").
const ADJACENT_STATES = ['PA', 'DE', 'WV', 'NJ', 'NY', 'NC', 'OH'];

const HIGH_SECURITY_AREAS = ['ip/patent', 'corporate/m&a', 'litigation', 'healthcare/life-sciences'];
const AUTOMATION_UPSELL_AREAS = ['immigration', 'personal injury', 'family'];
const LOW_SENSITIVITY_AREAS = ['traffic', 'estate planning', 'general', 'wills'];

/** Classify a firm's geography into a graduated tier. */
function geoTier(company) {
  const state = (company.state || '').toUpperCase();
  const county = (company.county || '').toLowerCase().trim();
  const core = DMV_CORE[state];
  if (core) {
    if (core.includes('*') || core.some((r) => county.includes(r))) return 'dmv_core';
    return 'dmv_state'; // in a DMV state but outside the priority counties
  }
  if (ADJACENT_STATES.includes(state)) return 'adjacent';
  return 'us';
}

function aiSignalCount(company) {
  const s = company.aiAdoptionSignals || company.ai_adoption_signals || {};
  let n = 0;
  if (s.mentions_ai) n++;
  if ((s.legal_ai_tools && s.legal_ai_tools.length) > 0) n++;
  if (s.intake_chatbot) n++;
  if (s.hiring_legalops) n++;
  if (s.recent_modernization) n++;
  return n;
}

function hasArea(company, list) {
  const areas = (company.practiceAreas || company.practice_areas || []).map((a) => a.toLowerCase());
  return areas.some((a) => list.some((l) => a.includes(l)));
}

/**
 * Pure scoring function. Returns { score, geoTier, disqualified, disqualifyReasons,
 * lines, qualifiesAiSignal }. Disqualifiers short-circuit qualification but a (low)
 * score is still computed so disqualified rows remain sortable/inspectable.
 */
function scoreCompany(company, weights = DEFAULT_WEIGHTS) {
  const w = weights || DEFAULT_WEIGHTS;
  const lines = [];
  const disqualifyReasons = [];
  const attorneys = company.attorneyCount ?? company.attorney_count ?? 0;
  const independent = company.independent !== false;
  const website = company.website;
  const aiCount = aiSignalCount(company);
  const triggers = (company.triggerEvents || company.trigger_events || []).length;
  const hasDigitalFootprint = !!website || aiCount > 0;
  const tier = geoTier(company);

  // -------- Disqualifiers --------
  if (attorneys > 0 && attorneys <= 2) disqualifyReasons.push('Solo / 1–2 attorney firm');
  if (attorneys >= 150) disqualifyReasons.push('150+ attorneys (too large)');
  if (!independent) disqualifyReasons.push('AmLaw branch / not independent');
  if (!hasDigitalFootprint) disqualifyReasons.push('Zero digital footprint');
  if (hasArea(company, LOW_SENSITIVITY_AREAS) && !hasArea(company, HIGH_SECURITY_AREAS) && aiCount === 0)
    disqualifyReasons.push('Low-sensitivity practice with no AI adoption');

  // -------- Positive scoring --------
  const geoPts = w.geography[tier] ?? 0;
  if (geoPts > 0) {
    const label = { dmv_core: 'In-territory (DMV core)', dmv_state: 'DMV state', adjacent: 'Near DMV (adjacent state)' }[tier];
    lines.push({ label, points: geoPts });
  }

  const minA = w.size.min_attorneys, maxA = w.size.max_attorneys;
  if (attorneys >= minA && attorneys <= maxA)
    lines.push({ label: `Size in range (${minA}–${maxA} attorneys)`, points: w.firmographic.size_in_range });
  if (independent) lines.push({ label: 'Independent firm', points: w.firmographic.independent });

  if (hasArea(company, HIGH_SECURITY_AREAS))
    lines.push({ label: 'High-security practice area', points: w.practice_area.high_security });
  else if (hasArea(company, AUTOMATION_UPSELL_AREAS))
    lines.push({ label: 'Automation-upsell practice', points: w.practice_area.automation_upsell });

  if (aiCount > 0)
    lines.push({ label: `AI-adoption signals ×${aiCount}`, points: Math.min(aiCount * w.ai_signal_each, w.ai_signal_max) });
  if (triggers > 0)
    lines.push({ label: `Trigger events ×${triggers}`, points: Math.min(triggers * w.trigger_event_each, w.trigger_event_max) });

  const raw = lines.reduce((sum, l) => sum + l.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    geoTier: tier,
    disqualified: disqualifyReasons.length > 0,
    disqualifyReasons,
    lines,
    qualifiesAiSignal: aiCount > 0,
  };
}

function personaGuidance(company) {
  const big = (company.attorneyCount ?? 0) > 50;
  return big
    ? 'Lead to Managing Partner; route through Firm Administrator/COO. Director of IT is in play at this size.'
    : 'Lead to Managing Partner; route through Firm Administrator. (No dedicated IT below ~50 attorneys.)';
}

const SERVICE_LADDER = ['posture_assessment', 'red_teaming', 'remediation', 'ai_enablement'];

module.exports = { DEFAULT_WEIGHTS, scoreCompany, geoTier, aiSignalCount, personaGuidance, SERVICE_LADDER };
