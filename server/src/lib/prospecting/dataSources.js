// =============================================================================
// Prospecting data sources — pluggable DataSource interface.
//
//   interface DataSource { name; isConfigured(); async discover({ count }) -> Candidate[] }
//   Candidate = { name, domain, website, linkedinUrl?, state, county, city,
//                 attorneyCount, staffCount, practiceAreas[], independent,
//                 aiAdoptionSignals{}, triggerEvents[], source }
//
// Two implementations ship:
//   • ClayDataSource     — calls a Clay table webhook for live net-new discovery
//                          (results return async via the clay-callback route).
//   • GeneratorDataSource— deterministic, always-available synthetic firm
//                          generator, DMV-weighted, so the engine can always
//                          top the pipeline up to target with no external keys.
//
// Slot a real provider (Apollo, Google Places, People Data Labs) in by writing
// another object with the same shape and registering it in getDataSource().
// =============================================================================

// ---- Geography pools (weighted toward the DMV; "closer is better") ----------
const POOLS = {
  dmv_core: [
    { state: 'DC', county: 'District of Columbia', cities: ['Washington'] },
    { state: 'MD', county: 'Montgomery', cities: ['Bethesda', 'Rockville', 'Silver Spring'] },
    { state: 'MD', county: "Prince George's", cities: ['Bowie', 'Hyattsville'] },
    { state: 'MD', county: 'Howard', cities: ['Columbia', 'Ellicott City'] },
    { state: 'MD', county: 'Anne Arundel', cities: ['Annapolis'] },
    { state: 'VA', county: 'Arlington', cities: ['Arlington'] },
    { state: 'VA', county: 'Alexandria', cities: ['Alexandria'] },
    { state: 'VA', county: 'Fairfax', cities: ['Fairfax', 'Tysons', 'Reston', 'McLean'] },
    { state: 'VA', county: 'Loudoun', cities: ['Leesburg', 'Ashburn'] },
    { state: 'VA', county: 'Prince William', cities: ['Manassas', 'Woodbridge'] },
  ],
  dmv_state: [
    { state: 'MD', county: 'Frederick', cities: ['Frederick'] },
    { state: 'MD', county: 'Baltimore City', cities: ['Baltimore'] },
    { state: 'VA', county: 'Henrico', cities: ['Richmond'] },
    { state: 'VA', county: 'Virginia Beach', cities: ['Virginia Beach', 'Norfolk'] },
  ],
  adjacent: [
    { state: 'PA', county: 'Philadelphia', cities: ['Philadelphia'] },
    { state: 'PA', county: 'Allegheny', cities: ['Pittsburgh'] },
    { state: 'DE', county: 'New Castle', cities: ['Wilmington'] },
    { state: 'NJ', county: 'Essex', cities: ['Newark'] },
    { state: 'NC', county: 'Mecklenburg', cities: ['Charlotte'] },
    { state: 'OH', county: 'Franklin', cities: ['Columbus'] },
  ],
  us: [
    { state: 'NY', county: 'New York', cities: ['New York'] },
    { state: 'CA', county: 'Los Angeles', cities: ['Los Angeles'] },
    { state: 'TX', county: 'Travis', cities: ['Austin'] },
    { state: 'IL', county: 'Cook', cities: ['Chicago'] },
    { state: 'FL', county: 'Miami-Dade', cities: ['Miami'] },
    { state: 'WA', county: 'King', cities: ['Seattle'] },
    { state: 'GA', county: 'Fulton', cities: ['Atlanta'] },
    { state: 'MA', county: 'Suffolk', cities: ['Boston'] },
  ],
};
const TIER_WEIGHTS = [
  ['dmv_core', 0.45], ['dmv_state', 0.2], ['adjacent', 0.18], ['us', 0.17],
];

const SURNAMES = ['Hartley', 'Donovan', 'Marsh', 'Calloway', 'Whitfield', 'Brennan', 'Okafor',
  'Saito', 'Delgado', 'Rosenthal', 'Nguyen', 'Abernathy', 'Castellano', 'Pruitt', 'Vance',
  'Ashford', 'Mercer', 'Holloway', 'Trang', 'Bauer', 'Salazar', 'Kingsley', 'Ferraro', 'Underwood'];
const PRACTICE_HIGH = ['IP/patent', 'corporate/M&A', 'litigation', 'healthcare/life-sciences'];
const PRACTICE_UPSELL = ['immigration', 'personal injury', 'family'];
const PRACTICE_LOW = ['estate planning', 'general', 'traffic'];
const AI_TOOLS = ['Harvey', 'CoCounsel', 'Lexis+ AI', 'Spellbook', 'Clio Duo'];
const TRIGGERS = ['new_ai_tool', 'client_security_questionnaire', 'lateral_growth', 'sector_breach'];
const SUFFIXES = ['LLP', 'PLLC', 'Law Group', 'Partners', 'Legal', '& Associates'];

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rnd(arr.length)];
function weightedTier() {
  const r = Math.random();
  let acc = 0;
  for (const [tier, w] of TIER_WEIGHTS) { acc += w; if (r <= acc) return tier; }
  return 'dmv_core';
}
function slug(s) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').slice(0, 24);
}

function makeCandidate(i) {
  const tier = weightedTier();
  const geo = pick(POOLS[tier]);
  const a = pick(SURNAMES);
  let b = pick(SURNAMES);
  while (b === a) b = pick(SURNAMES);
  const suffix = pick(SUFFIXES);
  const twoName = Math.random() < 0.5;
  const name = twoName ? `${a} & ${b} ${suffix}` : `${a} ${suffix}`;

  // Practice mix: mostly high-security, sometimes upsell, rarely low-sensitivity.
  const roll = Math.random();
  const practiceAreas = roll < 0.62 ? [pick(PRACTICE_HIGH)]
    : roll < 0.85 ? [pick(PRACTICE_UPSELL)]
    : [pick(PRACTICE_LOW)];
  if (Math.random() < 0.3) practiceAreas.push(pick(PRACTICE_HIGH));

  // Attorney count weighted toward the 10–75 sweet spot, with some out-of-band.
  const sizeRoll = Math.random();
  const attorneyCount = sizeRoll < 0.72 ? 10 + rnd(66)        // 10–75
    : sizeRoll < 0.86 ? 3 + rnd(7)                            // 3–9 (small)
    : sizeRoll < 0.95 ? 76 + rnd(60)                          // 76–135 (large but valid)
    : (Math.random() < 0.5 ? 1 + rnd(2) : 150 + rnd(180));    // solo OR 150+ (will DQ)

  const independent = Math.random() < 0.9;
  // ≥1 AI signal for ~80% so they clear the qualification gate.
  const sig = {};
  if (Math.random() < 0.8) sig.mentions_ai = true;
  if (Math.random() < 0.4) sig.legal_ai_tools = [pick(AI_TOOLS)];
  if (Math.random() < 0.3) sig.intake_chatbot = true;
  if (Math.random() < 0.25) sig.hiring_legalops = true;
  if (Math.random() < 0.2) sig.recent_modernization = true;

  const triggerEvents = Math.random() < 0.3 ? [pick(TRIGGERS)] : [];
  const domain = `${slug(name)}${rnd(900) + 100}.com`;

  return {
    name,
    domain,
    website: `https://${domain}`,
    linkedinUrl: null,
    state: geo.state,
    county: geo.county,
    city: pick(geo.cities),
    attorneyCount,
    staffCount: Math.round(attorneyCount * (2.5 + Math.random() * 1.5)),
    practiceAreas,
    independent,
    aiAdoptionSignals: sig,
    triggerEvents,
    source: 'generated',
  };
}

const GeneratorDataSource = {
  name: 'generated',
  isConfigured: () => true,
  async discover({ count }) {
    return Array.from({ length: count }, (_, i) => makeCandidate(i));
  },
};

// ---- Clay adapter -----------------------------------------------------------
// Clay does net-new discovery + enrichment inside a "table" that you trigger via
// an inbound webhook; enriched rows are posted back to your callback. So discover()
// fires the request and returns [] now — rows land later via the clay-callback
// route. Configure with CLAY_WEBHOOK_URL (the table's webhook) and optionally
// CLAY_API_KEY (sent as a bearer token).
const ClayDataSource = {
  name: 'clay',
  isConfigured: () => !!process.env.CLAY_WEBHOOK_URL,
  async discover({ count }) {
    if (!process.env.CLAY_WEBHOOK_URL) throw new Error('Clay not configured (set CLAY_WEBHOOK_URL).');
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.CLAY_API_KEY) headers.Authorization = `Bearer ${process.env.CLAY_API_KEY}`;
    // ICP brief sent to the Clay table; the table is expected to find matching
    // independent DMV-area law firms and enrich domain/size/practice/AI signals.
    const payload = {
      requested: count,
      icp: {
        vertical: 'law',
        independent: true,
        attorneyRange: [10, 75],
        geoPriority: ['DC', 'MD', 'VA', 'adjacent', 'US'],
        practiceAreas: PRACTICE_HIGH,
        requireAiSignal: true,
      },
      callbackUrl: process.env.CLAY_CALLBACK_URL || null,
    };
    await fetch(process.env.CLAY_WEBHOOK_URL, { method: 'POST', headers, body: JSON.stringify(payload) });
    // Async model: nothing to return synchronously.
    return [];
  },
};

/** Returns the configured live source if available, else the generator. */
function getDataSource(preferred) {
  if (preferred === 'clay' && ClayDataSource.isConfigured()) return ClayDataSource;
  if (preferred === 'generated') return GeneratorDataSource;
  // auto: prefer Clay when configured, else generator.
  if (ClayDataSource.isConfigured()) return ClayDataSource;
  return GeneratorDataSource;
}

module.exports = { getDataSource, GeneratorDataSource, ClayDataSource, POOLS };
