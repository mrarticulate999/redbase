// REDBASE CRM seed — pipeline stages, scoring config, ~20 named DMV firms with
// contacts/deals/tickets/segments, then runs the prospecting engine to top the
// pipeline up to the active-lead target (100). Idempotent on the named firms
// (dedup by domain); safe to re-run.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { DEFAULT_WEIGHTS, scoreCompany } = require('../server/src/lib/scoring');
const { runProspecting, countActiveLeads } = require('../server/src/lib/prospecting/engine');

const STAGES = [
  { key: 'new', label: 'New', probability: 5, position: 1 },
  { key: 'qualified', label: 'Qualified', probability: 20, position: 2 },
  { key: 'discovery_call', label: 'Discovery Call', probability: 35, position: 3 },
  { key: 'assessment_proposed', label: 'Assessment Proposed', probability: 55, position: 4 },
  { key: 'verbal_yes', label: 'Verbal Yes', probability: 75, position: 5 },
  { key: 'closed_won', label: 'Closed Won', probability: 100, position: 6 },
  { key: 'closed_lost', label: 'Closed Lost', probability: 0, position: 7 },
];

const FIRMS = [
  { name: 'Harbor & Klein LLP', domain: 'harborklein.com', state: 'VA', county: 'Arlington', city: 'Arlington', attorneyCount: 45, staffCount: 160, practiceAreas: ['IP/patent', 'litigation'], independent: true, aiAdoptionSignals: { mentions_ai: true, legal_ai_tools: ['Harvey'], intake_chatbot: true, hiring_legalops: true }, triggerEvents: ['new_ai_tool', 'lateral_growth'], leadStatus: 'working' },
  { name: 'Calderon Health Law Group', domain: 'calderonhealthlaw.com', state: 'DC', county: 'District of Columbia', city: 'Washington', attorneyCount: 28, staffCount: 95, practiceAreas: ['healthcare/life-sciences', 'litigation'], independent: true, aiAdoptionSignals: { mentions_ai: true, legal_ai_tools: ['CoCounsel'] }, triggerEvents: ['client_security_questionnaire'], leadStatus: 'working' },
  { name: 'Brightwater Corporate Counsel', domain: 'brightwatercc.com', state: 'MD', county: 'Montgomery', city: 'Bethesda', attorneyCount: 60, staffCount: 210, practiceAreas: ['corporate/M&A'], independent: true, aiAdoptionSignals: { mentions_ai: true, legal_ai_tools: ['Spellbook'], hiring_legalops: true, recent_modernization: true }, triggerEvents: ['sector_breach'], leadStatus: 'converted' },
  { name: 'Tilden & Roe', domain: 'tildenroe.com', state: 'VA', county: 'Fairfax', city: 'Fairfax', attorneyCount: 38, staffCount: 120, practiceAreas: ['litigation', 'IP/patent'], independent: true, aiAdoptionSignals: { mentions_ai: true, legal_ai_tools: ['Lexis+ AI'], intake_chatbot: true }, triggerEvents: [], leadStatus: 'new' },
  { name: 'Potomac Patent Partners', domain: 'potomacpatent.com', state: 'VA', county: 'Alexandria', city: 'Alexandria', attorneyCount: 22, staffCount: 70, practiceAreas: ['IP/patent'], independent: true, aiAdoptionSignals: { mentions_ai: true, legal_ai_tools: ['Harvey'], hiring_legalops: true }, triggerEvents: ['new_ai_tool'], leadStatus: 'converted' },
  { name: 'Anne Arundel Trial Advocates', domain: 'aatrial.com', state: 'MD', county: 'Anne Arundel', city: 'Annapolis', attorneyCount: 30, staffCount: 100, practiceAreas: ['litigation'], independent: true, aiAdoptionSignals: { mentions_ai: true, legal_ai_tools: ['Clio Duo'] }, triggerEvents: [], leadStatus: 'nurture' },
  { name: 'Loudoun M&A Advisors PLLC', domain: 'loudounma.com', state: 'VA', county: 'Loudoun', city: 'Leesburg', attorneyCount: 18, staffCount: 55, practiceAreas: ['corporate/M&A'], independent: true, aiAdoptionSignals: { mentions_ai: true }, triggerEvents: ['lateral_growth'], leadStatus: 'working' },
  { name: 'Howard Life Sciences Law', domain: 'howardlifesci.com', state: 'MD', county: 'Howard', city: 'Columbia', attorneyCount: 52, staffCount: 180, practiceAreas: ['healthcare/life-sciences', 'corporate/M&A'], independent: true, aiAdoptionSignals: { mentions_ai: true, legal_ai_tools: ['CoCounsel'], intake_chatbot: true, recent_modernization: true }, triggerEvents: [], leadStatus: 'working' },
  { name: 'Capital Immigration Group', domain: 'capitalimmig.com', state: 'DC', county: 'District of Columbia', city: 'Washington', attorneyCount: 40, staffCount: 150, practiceAreas: ['immigration'], independent: true, aiAdoptionSignals: { mentions_ai: true, intake_chatbot: true }, triggerEvents: [], leadStatus: 'new' },
  { name: 'Beltway Injury Lawyers', domain: 'beltwayinjury.com', state: 'VA', county: 'Prince William', city: 'Manassas', attorneyCount: 25, staffCount: 90, practiceAreas: ['personal injury'], independent: true, aiAdoptionSignals: { intake_chatbot: true }, triggerEvents: [], leadStatus: 'new' },
  { name: 'Riverside Family Law', domain: 'riversidefamilylaw.com', state: 'MD', county: "Prince George's", city: 'Bowie', attorneyCount: 14, staffCount: 40, practiceAreas: ['family'], independent: true, aiAdoptionSignals: { mentions_ai: true }, triggerEvents: [], leadStatus: 'nurture' },
  { name: 'Old Town General Counsel', domain: 'oldtowngc.com', state: 'VA', county: 'Alexandria', city: 'Alexandria', attorneyCount: 12, staffCount: 35, practiceAreas: ['corporate/M&A', 'general'], independent: true, aiAdoptionSignals: { mentions_ai: true }, triggerEvents: [], leadStatus: 'new' },
  { name: 'Bethesda Tax & Corporate', domain: 'bethesdataxcorp.com', state: 'MD', county: 'Montgomery', city: 'Bethesda', attorneyCount: 16, staffCount: 48, practiceAreas: ['corporate/M&A', 'tax'], independent: true, aiAdoptionSignals: { recent_modernization: true }, triggerEvents: [], leadStatus: 'new' },
  { name: 'Lakeside IP Group', domain: 'lakesideip.com', state: 'PA', county: 'Philadelphia', city: 'Philadelphia', attorneyCount: 35, staffCount: 110, practiceAreas: ['IP/patent'], independent: true, aiAdoptionSignals: { mentions_ai: true, legal_ai_tools: ['Harvey'] }, triggerEvents: [], leadStatus: 'new' },
  // disqualified examples
  { name: 'Marcus Vance, Attorney at Law', domain: 'marcusvancelaw.com', state: 'VA', county: 'Arlington', city: 'Arlington', attorneyCount: 1, staffCount: 2, practiceAreas: ['family'], independent: true, aiAdoptionSignals: {}, triggerEvents: [], leadStatus: 'disqualified' },
  { name: 'The Reed Law Office', domain: 'reedlawoffice.com', state: 'MD', county: 'Howard', city: 'Ellicott City', attorneyCount: 2, staffCount: 3, practiceAreas: ['general'], independent: true, aiAdoptionSignals: {}, triggerEvents: [], leadStatus: 'disqualified' },
  { name: 'Sterling Global LLP (DC Office)', domain: 'sterlingglobal.com', state: 'DC', county: 'District of Columbia', city: 'Washington', attorneyCount: 320, staffCount: 1400, practiceAreas: ['corporate/M&A', 'litigation'], independent: false, aiAdoptionSignals: { mentions_ai: true, legal_ai_tools: ['Harvey', 'CoCounsel'], intake_chatbot: true }, triggerEvents: ['new_ai_tool'], leadStatus: 'disqualified' },
  { name: 'Patterson & Greaves', domain: 'pattersongreaves.com', state: 'VA', county: 'Fairfax', city: 'Tysons', attorneyCount: 180, staffCount: 720, practiceAreas: ['litigation', 'corporate/M&A'], independent: true, aiAdoptionSignals: { mentions_ai: true, legal_ai_tools: ['Lexis+ AI'], hiring_legalops: true }, triggerEvents: [], leadStatus: 'disqualified' },
  { name: 'Quietwood Legal', domain: null, state: 'MD', county: 'Montgomery', city: 'Rockville', attorneyCount: 20, staffCount: 60, practiceAreas: ['litigation'], independent: true, aiAdoptionSignals: {}, triggerEvents: [], leadStatus: 'disqualified' },
  { name: 'Greenfield Traffic & Estates', domain: 'greenfieldtraffic.com', state: 'VA', county: 'Prince William', city: 'Woodbridge', attorneyCount: 8, staffCount: 18, practiceAreas: ['traffic', 'estate planning'], independent: true, aiAdoptionSignals: {}, triggerEvents: [], leadStatus: 'disqualified' },
];

const CONTACTS = {
  'Harbor & Klein LLP': [['Dana', 'Klein', 'Managing Partner', 'economic_buyer', 'dklein@harborklein.com'], ['Renee', 'Alvarez', 'Firm Administrator', 'champion', 'ralvarez@harborklein.com']],
  'Calderon Health Law Group': [['Miguel', 'Calderon', 'Founding Partner', 'economic_buyer', 'mcalderon@calderonhealthlaw.com'], ['Priya', 'Nandakumar', 'COO', 'champion', 'pnandakumar@calderonhealthlaw.com']],
  'Brightwater Corporate Counsel': [['Susan', 'Brightwater', 'Managing Partner', 'economic_buyer', 'sbrightwater@brightwatercc.com'], ['Tom', 'Beckley', 'Director of IT', 'it', 'tbeckley@brightwatercc.com'], ['Gina', 'Ruiz', 'Legal Operations Manager', 'champion', 'gruiz@brightwatercc.com']],
  'Potomac Patent Partners': [['Helen', 'Vasquez', 'Founding Partner', 'economic_buyer', 'hvasquez@potomacpatent.com'], ['Derek', 'Lin', 'Firm Administrator', 'champion', 'dlin@potomacpatent.com']],
  'Howard Life Sciences Law': [['James', 'Howard', 'Managing Partner', 'economic_buyer', 'jhoward@howardlifesci.com'], ['Nina', 'Park', 'Director of IT', 'it', 'npark@howardlifesci.com']],
  'Tilden & Roe': [['Albert', 'Roe', 'Managing Partner', 'economic_buyer', 'aroe@tildenroe.com']],
  'Loudoun M&A Advisors PLLC': [['Karen', 'Doyle', 'Managing Partner', 'economic_buyer', 'kdoyle@loudounma.com']],
};

const DEALS = [
  ['Harbor & Klein LLP', 'Harbor & Klein — AI Posture Assessment', 'posture_assessment', 'discovery_call', 35000, '2026-07-20', 'referral'],
  ['Calderon Health Law Group', 'Calderon — HIPAA AI Posture Assessment', 'posture_assessment', 'assessment_proposed', 42000, '2026-07-10', 'outbound'],
  ['Brightwater Corporate Counsel', 'Brightwater — Red Team Engagement', 'red_teaming', 'verbal_yes', 75000, '2026-06-30', 'expansion'],
  ['Howard Life Sciences Law', 'Howard — AI Posture Assessment', 'posture_assessment', 'qualified', 45000, '2026-08-15', 'outbound'],
  ['Tilden & Roe', 'Tilden & Roe — Posture Assessment', 'posture_assessment', 'new', 30000, '2026-08-30', 'website'],
  ['Potomac Patent Partners', 'Potomac — Posture Assessment', 'posture_assessment', 'closed_won', 28000, '2026-05-28', 'referral'],
  ['Potomac Patent Partners', 'Potomac — Red Team Follow-on', 'red_teaming', 'new', 60000, '2026-09-15', 'expansion'],
  ['Anne Arundel Trial Advocates', 'Anne Arundel — Posture Assessment', 'posture_assessment', 'closed_lost', 25000, '2026-05-15', 'outbound'],
  ['Loudoun M&A Advisors PLLC', 'Loudoun — Posture Assessment', 'posture_assessment', 'discovery_call', 32000, '2026-07-25', 'event'],
];

const TICKETS = [
  ['Brightwater Corporate Counsel', 'Re-test request after remediation window', 'open', 'high'],
  ['Potomac Patent Partners', 'Client security questionnaire response support', 'pending', 'medium'],
  ['Harbor & Klein LLP', 'Scoping clarification on cloud assets', 'resolved', 'low'],
];

async function main() {
  // Stages
  for (const s of STAGES) {
    await prisma.pipelineStage.upsert({ where: { key: s.key }, update: { label: s.label, probability: s.probability, position: s.position }, create: s });
  }
  const stageProb = Object.fromEntries(STAGES.map((s) => [s.key, s.probability]));

  // Scoring config
  await prisma.scoringConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1, weights: DEFAULT_WEIGHTS } });

  // Named firms
  const idByName = {};
  for (const f of FIRMS) {
    const score = scoreCompany(f, DEFAULT_WEIGHTS);
    const existing = f.domain ? await prisma.company.findUnique({ where: { domain: f.domain } }) : await prisma.company.findFirst({ where: { name: f.name } });
    const data = {
      name: f.name, vertical: 'law', website: f.domain ? `https://${f.domain}` : null, domain: f.domain || null,
      state: f.state, county: f.county, city: f.city, attorneyCount: f.attorneyCount, staffCount: f.staffCount,
      practiceAreas: f.practiceAreas, independent: f.independent, aiAdoptionSignals: f.aiAdoptionSignals,
      triggerEvents: f.triggerEvents, priorityScore: score.score, geoTier: score.geoTier,
      disqualified: score.disqualified, leadStatus: f.leadStatus, source: 'referral', owner: 'Grant Johnson',
    };
    const c = existing
      ? await prisma.company.update({ where: { id: existing.id }, data })
      : await prisma.company.create({ data });
    idByName[f.name] = c.id;
  }

  // Contacts (skip if firm already has contacts)
  for (const [firm, list] of Object.entries(CONTACTS)) {
    const companyId = idByName[firm];
    if (!companyId) continue;
    const have = await prisma.contact.count({ where: { companyId } });
    if (have > 0) continue;
    for (const [firstName, lastName, title, personaRole, email] of list) {
      await prisma.contact.create({ data: { companyId, firstName, lastName, title, personaRole, email } });
    }
  }

  // Deals
  for (const [firm, name, serviceType, stage, amount, close, source] of DEALS) {
    const companyId = idByName[firm];
    if (!companyId) continue;
    const have = await prisma.deal.findFirst({ where: { companyId, name } });
    if (have) continue;
    await prisma.deal.create({
      data: { companyId, name, serviceType, stage, amount, probability: stageProb[stage] ?? 5, expectedClose: new Date(close), source, owner: 'Grant Johnson' },
    });
  }

  // Tickets
  for (const [firm, subject, status, priority] of TICKETS) {
    const companyId = idByName[firm];
    if (!companyId) continue;
    const have = await prisma.ticket.findFirst({ where: { companyId, subject } });
    if (have) continue;
    await prisma.ticket.create({
      data: { companyId, subject, status, priority, assignee: 'Grant Johnson', resolvedAt: status === 'resolved' || status === 'closed' ? new Date() : null },
    });
  }

  // A few activities/tasks on Harbor & Klein
  const hk = idByName['Harbor & Klein LLP'];
  if (hk && (await prisma.activity.count({ where: { relatedId: hk } })) === 0) {
    await prisma.activity.createMany({
      data: [
        { relatedType: 'company', relatedId: hk, type: 'note', body: 'Intro call went well. Managing Partner concerned about Harvey data exposure.' },
        { relatedType: 'company', relatedId: hk, type: 'task', body: 'Send tailored posture assessment proposal', dueAt: new Date('2026-06-18T17:00:00Z') },
      ],
    });
  }

  // Segments
  if ((await prisma.segment.count()) === 0) {
    await prisma.segment.createMany({
      data: [
        { name: 'DMV High-Priority Law (score ≥ 70)', filterJson: { vertical: 'law', states: ['DC', 'MD', 'VA'], minScore: 70, excludeDisqualified: true } },
        { name: 'Automation Upsell Targets', filterJson: { vertical: 'law', practiceAreas: ['immigration', 'personal injury', 'family'], excludeDisqualified: true } },
      ],
    });
  }

  // Top up to the active-lead target via the prospecting engine.
  const before = await countActiveLeads();
  const run = await runProspecting({ source: 'generated' });
  console.log(`CRM seed complete. Active leads ${before} → ${run.activeAfter} (target ${run.target}, inserted ${run.inserted}).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
