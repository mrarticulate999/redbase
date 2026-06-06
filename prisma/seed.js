// REDBASE seed — users, learning tracks, sample clients & tasks.
// Idempotent: upserts users/learning items so re-running is safe.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

const USERS = [
  { username: 'admin', password: 'password123', role: 'admin' },
  { username: 'operator1', password: 'password123', role: 'operator' },
  { username: 'operator2', password: 'password123', role: 'operator' },
];

// Learning tracks. OWASP LLM Top 10 has all 10; others have 5 curated items.
const LEARNING = [
  // ---- OWASP LLM Top 10 (2025) ----
  { track: 'OWASP LLM Top 10', title: 'LLM01: Prompt Injection', description: 'Direct & indirect prompt injection attacks against LLM applications.', resourceUrl: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', estimatedHours: 3 },
  { track: 'OWASP LLM Top 10', title: 'LLM02: Sensitive Information Disclosure', description: 'Leakage of PII, secrets, and proprietary data through model outputs.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 2 },
  { track: 'OWASP LLM Top 10', title: 'LLM03: Supply Chain Vulnerabilities', description: 'Risks in third-party models, datasets, and plugins.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 2 },
  { track: 'OWASP LLM Top 10', title: 'LLM04: Data and Model Poisoning', description: 'Training/fine-tuning data manipulation and backdoors.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 3 },
  { track: 'OWASP LLM Top 10', title: 'LLM05: Improper Output Handling', description: 'Downstream injection (XSS/SSRF/RCE) from unsanitized model output.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 2 },
  { track: 'OWASP LLM Top 10', title: 'LLM06: Excessive Agency', description: 'Over-permissioned agents taking damaging autonomous actions.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 3 },
  { track: 'OWASP LLM Top 10', title: 'LLM07: System Prompt Leakage', description: 'Extraction of hidden system prompts and guardrail logic.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 2 },
  { track: 'OWASP LLM Top 10', title: 'LLM08: Vector and Embedding Weaknesses', description: 'RAG poisoning and embedding-space attacks.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 3 },
  { track: 'OWASP LLM Top 10', title: 'LLM09: Misinformation', description: 'Hallucination and overreliance leading to harmful decisions.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 2 },
  { track: 'OWASP LLM Top 10', title: 'LLM10: Unbounded Consumption', description: 'Denial-of-wallet and resource exhaustion attacks.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 2 },

  // ---- Prompt Injection Techniques (beginner → advanced) ----
  { track: 'Prompt Injection Techniques', title: 'Fundamentals of Direct Prompt Injection', description: 'Beginner: instruction override, role-play jailbreaks, delimiter confusion.', resourceUrl: 'https://learnprompting.org/docs/prompt_hacking/injection', estimatedHours: 2 },
  { track: 'Prompt Injection Techniques', title: 'Indirect / Cross-Domain Injection', description: 'Intermediate: payloads embedded in retrieved web pages, files, and emails.', resourceUrl: 'https://arxiv.org/abs/2302.12173', estimatedHours: 3 },
  { track: 'Prompt Injection Techniques', title: 'Obfuscation & Encoding Bypasses', description: 'Intermediate: base64, homoglyphs, token smuggling, language switching.', resourceUrl: 'https://learnprompting.org/docs/prompt_hacking/offensive_measures/obfuscation', estimatedHours: 3 },
  { track: 'Prompt Injection Techniques', title: 'Multi-Turn & Crescendo Attacks', description: 'Advanced: gradual escalation across a conversation to defeat guardrails.', resourceUrl: 'https://arxiv.org/abs/2404.01833', estimatedHours: 4 },
  { track: 'Prompt Injection Techniques', title: 'Automated Adversarial Suffixes (GCG)', description: 'Advanced: gradient-based transferable jailbreak suffix generation.', resourceUrl: 'https://arxiv.org/abs/2307.15043', estimatedHours: 5 },

  // ---- AI Agent Attack Surface ----
  { track: 'AI Agent Attack Surface', title: 'Tool/Function-Calling Abuse', description: 'Coercing agents into invoking dangerous tools with attacker-chosen args.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 3 },
  { track: 'AI Agent Attack Surface', title: 'Memory & Context Poisoning', description: 'Persisting malicious instructions in agent long-term memory.', resourceUrl: 'https://arxiv.org/abs/2402.06363', estimatedHours: 3 },
  { track: 'AI Agent Attack Surface', title: 'Multi-Agent Trust Exploitation', description: 'Compromising one agent to manipulate peers in a swarm.', resourceUrl: 'https://arxiv.org/abs/2406.13352', estimatedHours: 4 },
  { track: 'AI Agent Attack Surface', title: 'MCP & Plugin Security', description: 'Threat modeling Model Context Protocol servers and connectors.', resourceUrl: 'https://modelcontextprotocol.io/', estimatedHours: 3 },
  { track: 'AI Agent Attack Surface', title: 'Sandboxing & Least-Privilege for Agents', description: 'Containment patterns: capability scoping, human-in-the-loop approvals.', resourceUrl: 'https://genai.owasp.org/', estimatedHours: 3 },

  // ---- Embedded / Edge AI Security (ME/EE background) ----
  { track: 'Embedded/Edge AI Security', title: 'On-Device Model Extraction', description: 'Reverse engineering quantized models from firmware & flash.', resourceUrl: 'https://arxiv.org/abs/2011.13564', estimatedHours: 4 },
  { track: 'Embedded/Edge AI Security', title: 'Side-Channel Attacks on Edge Inference', description: 'Power/EM analysis to recover model parameters or inputs.', resourceUrl: 'https://eprint.iacr.org/2018/1191', estimatedHours: 5 },
  { track: 'Embedded/Edge AI Security', title: 'Sensor & Physical Adversarial Inputs', description: 'Adversarial patches, audio, and signals against embedded perception.', resourceUrl: 'https://arxiv.org/abs/1707.08945', estimatedHours: 4 },
  { track: 'Embedded/Edge AI Security', title: 'Secure Boot & TEE for AI Accelerators', description: 'Hardware roots of trust, TrustZone, and secure enclaves for NPUs.', resourceUrl: 'https://www.arm.com/technologies/trustzone-for-cortex-a', estimatedHours: 3 },
  { track: 'Embedded/Edge AI Security', title: 'Firmware Supply-Chain for TinyML', description: 'OTA update integrity and signing for embedded ML pipelines.', resourceUrl: 'https://www.tinyml.org/', estimatedHours: 3 },

  // ---- Compliance: EU AI Act + NIST AI RMF ----
  { track: 'Compliance: EU AI Act + NIST AI RMF', title: 'EU AI Act Risk Tiers', description: 'Unacceptable / high / limited / minimal risk classification.', resourceUrl: 'https://artificialintelligenceact.eu/', estimatedHours: 3 },
  { track: 'Compliance: EU AI Act + NIST AI RMF', title: 'High-Risk System Obligations', description: 'Conformity assessment, technical documentation, logging duties.', resourceUrl: 'https://artificialintelligenceact.eu/', estimatedHours: 4 },
  { track: 'Compliance: EU AI Act + NIST AI RMF', title: 'NIST AI RMF Core: Govern/Map/Measure/Manage', description: 'The four functions and how to operationalize them.', resourceUrl: 'https://www.nist.gov/itl/ai-risk-management-framework', estimatedHours: 3 },
  { track: 'Compliance: EU AI Act + NIST AI RMF', title: 'NIST Generative AI Profile (600-1)', description: 'GenAI-specific risk controls companion to the RMF.', resourceUrl: 'https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf', estimatedHours: 3 },
  { track: 'Compliance: EU AI Act + NIST AI RMF', title: 'Red-Team Reporting for Compliance', description: 'Mapping findings to regulatory evidence and audit artifacts.', resourceUrl: 'https://www.nist.gov/itl/ai-risk-management-framework', estimatedHours: 2 },
];

async function main() {
  console.log('Seeding REDBASE...');

  // Users (upsert by username so passwords reset to known values on reseed).
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash, role: u.role },
      create: { username: u.username, passwordHash, role: u.role },
    });
  }
  console.log(`  ✓ ${USERS.length} users`);

  // Learning items — keyed by (track, title) to stay idempotent.
  let order = {};
  for (const item of LEARNING) {
    order[item.track] = (order[item.track] ?? -1) + 1;
    const existing = await prisma.learningItem.findFirst({
      where: { track: item.track, title: item.title },
    });
    if (existing) {
      await prisma.learningItem.update({
        where: { id: existing.id },
        data: { ...item, order: order[item.track] },
      });
    } else {
      await prisma.learningItem.create({ data: { ...item, order: order[item.track] } });
    }
  }
  console.log(`  ✓ ${LEARNING.length} learning items across 5 tracks`);

  // Sample clients (only if none exist).
  const clientCount = await prisma.client.count();
  let clients = [];
  if (clientCount === 0) {
    clients = await Promise.all([
      prisma.client.create({
        data: {
          name: 'Meridian Health AI',
          contactName: 'Dr. Sarah Chen',
          email: 'sarah.chen@meridianhealth.example',
          phone: '+1-415-555-0142',
          industry: 'Healthcare',
          aiSystemType: 'Clinical decision-support LLM (RAG over EHR notes)',
          status: 'Active',
          notes: 'Engaged for a full prompt-injection assessment of their patient-facing chatbot. NDA signed.',
          files: ['MSA_Meridian_signed.pdf', 'Scope_of_Work_v2.pdf'],
          history: ['2026-04-12T09:00:00.000Z — Client created (kickoff call completed)'],
        },
      }),
      prisma.client.create({
        data: {
          name: 'Volt Robotics',
          contactName: 'Marcus Webb',
          email: 'm.webb@voltrobotics.example',
          phone: '+1-512-555-0199',
          industry: 'Industrial Automation',
          aiSystemType: 'Edge vision models on warehouse AMRs',
          status: 'Lead',
          notes: 'Interested in embedded/edge AI security review. Awaiting budget approval.',
          files: ['Intro_deck.pdf'],
          history: ['2026-05-20T14:30:00.000Z — Client created (inbound lead from referral)'],
        },
      }),
    ]);
    console.log('  ✓ 2 sample clients');
  } else {
    clients = await prisma.client.findMany({ take: 2 });
    console.log('  • clients already present, skipping');
  }

  // Sample tasks (only if none exist).
  const taskCount = await prisma.task.count();
  if (taskCount === 0) {
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    const op1 = await prisma.user.findUnique({ where: { username: 'operator1' } });
    const op2 = await prisma.user.findUnique({ where: { username: 'operator2' } });

    await prisma.task.createMany({
      data: [
        {
          title: 'Build indirect prompt-injection test corpus for Meridian',
          description: 'Assemble malicious EHR-note payloads targeting their RAG pipeline.',
          assigneeId: op1?.id || null,
          clientId: clients[0]?.id || null,
          status: 'InProgress',
          priority: 'High',
          dueDate: new Date('2026-06-06T17:00:00.000Z'),
          order: 0,
        },
        {
          title: 'Draft scoping proposal for Volt Robotics edge review',
          description: 'Side-channel + model-extraction scope for AMR vision models.',
          assigneeId: op2?.id || null,
          clientId: clients[1]?.id || null,
          status: 'Backlog',
          priority: 'Medium',
          dueDate: new Date('2026-06-13T17:00:00.000Z'),
          order: 0,
        },
        {
          title: 'Finalize Q2 NIST AI RMF mapping template',
          description: 'Reusable findings-to-control mapping for client reports.',
          assigneeId: admin?.id || null,
          clientId: null,
          status: 'Review',
          priority: 'Low',
          dueDate: new Date('2026-06-02T17:00:00.000Z'),
          order: 0,
        },
      ],
    });
    console.log('  ✓ 3 sample tasks');
  } else {
    console.log('  • tasks already present, skipping');
  }

  // Sample finance entries (only if none exist) so the dashboard renders real data.
  const financeCount = await prisma.financeEntry.count();
  if (financeCount === 0) {
    await prisma.financeEntry.createMany({
      data: [
        { type: 'income', amount: 28000, date: new Date('2026-04-15'), clientId: clients[0]?.id || null, category: 'Consulting', description: 'Meridian assessment — phase 1', invoiceNumber: 'INV-1001', status: 'Paid' },
        { type: 'income', amount: 32000, date: new Date('2026-05-10'), clientId: clients[0]?.id || null, category: 'Consulting', description: 'Meridian assessment — phase 2', invoiceNumber: 'INV-1002', status: 'Pending' },
        { type: 'expense', amount: 1200, date: new Date('2026-04-03'), category: 'Tooling', description: 'Burp Suite Pro + cloud GPU credits' },
        { type: 'expense', amount: 850, date: new Date('2026-05-02'), category: 'Software', description: 'Team SaaS subscriptions' },
        { type: 'expense', amount: 2400, date: new Date('2026-05-18'), category: 'Travel', description: 'On-site at Volt Robotics (scoping)' },
      ],
    });
    console.log('  ✓ 5 sample finance entries');
  } else {
    console.log('  • finance entries already present, skipping');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
