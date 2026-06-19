// Seed the Learning section: four roadmap tracks -> modules -> checkable items.
// IDs are deterministic so re-running upserts the same rows and never wipes a
// founder's progress (LearningProgress references itemId). Prose bodies for each
// track are rendered client-side from client/src/content/*.md.
const prisma = require('../server/src/lib/prisma');

const TRACKS = [
  {
    slug: 'ai-engineering',
    title: 'AI Engineering',
    subtitle: '0 → full-fledged AI engineer',
    accentColor: 'emerald',
    estDuration: '6 months',
    description: 'Python/ML fluency, the modern LLM application stack (RAG, agents, evals, fine-tuning), and production/MLOps muscle.',
    modules: [
      { title: 'Certifications', summary: 'Run in parallel — don’t stop building for them.', items: [
        'Pass AWS AI Practitioner (AIF-C01)',
        'Pass AWS ML Engineer – Associate (MLA-C01)',
        '(Optional) AWS GenAI Developer – Professional',
      ]},
      { title: 'M1 — Python + ML foundations', summary: 'Fluency in the tooling, not deriving backprop.', items: [
        'Train & evaluate a scikit-learn model',
        'Ship a tabular ML project to GitHub w/ README',
        'Start AIF-C01 study',
      ]},
      { title: 'M2 — Deep learning + transformers', summary: 'PyTorch, attention, embeddings, Hugging Face.', items: [
        'Write a PyTorch training loop by hand',
        'Wrap a Hugging Face model in a FastAPI endpoint',
        'Sit AIF-C01 exam',
      ]},
      { title: 'M3 — LLM app engineering', summary: 'Prompt engineering + production RAG.', items: [
        'Master prompt engineering patterns',
        'Ship a RAG app with citations (Supabase + pgvector)',
      ]},
      { title: 'M4 — Agents, evals, fine-tuning', summary: 'Evals are your moat.', items: [
        'Build a tool-using agent',
        'Build an eval harness with before/after metrics',
        'Run one real fine-tune',
        'Start MLA-C01 prep',
      ]},
      { title: 'M5 — MLOps & deployment', summary: 'Docker, endpoints, monitoring, drift.', items: [
        'Productionize a project (Docker + deployed endpoint + monitoring)',
        'Sit MLA-C01 exam',
      ]},
      { title: 'M6 — Capstone & portfolio', summary: 'RAG + agents + evals + deploy, then polish.', items: [
        'Ship capstone (RAG + agents + evals + deploy)',
        'Polish 4–5 repo portfolio + write-ups',
      ]},
    ],
  },
  {
    slug: 'cloud-security',
    title: 'Cloud Security',
    subtitle: 'Fundamentals, certs, hands-on defense',
    accentColor: 'sky',
    estDuration: '≈6 months',
    description: 'Cloud security from first principles: IAM, network isolation, encryption, shared responsibility — enough depth to architect, scope, and defend.',
    modules: [
      { title: 'Certifications', summary: 'Security+ → CCSK → cloud specialty.', items: [
        'Pass CompTIA Security+ (SY0-701)',
        'Pass CCSK',
        'Pass AWS Security – Specialty (SCS-C03) (or AZ-500)',
      ]},
      { title: 'M1 — Cloud + networking + security fundamentals', summary: 'VPCs, subnets, TLS, CIA triad.', items: [
        'Build a secure VPC (public/private subnets) by hand',
        'Start Security+ study',
      ]},
      { title: 'M2 — Identity, access, data protection', summary: 'IAM deep-dive + encryption.', items: [
        'Write least-privilege IAM policies from scratch',
        'Enable CloudTrail + secure an encrypted S3 bucket',
        'Sit Security+ exam',
      ]},
      { title: 'M3 — Threats, detection, IR', summary: 'GuardDuty, MITRE ATT&CK, SOC 2.', items: [
        'Trigger & triage GuardDuty findings',
        'Start CCSK study',
        'Map threats to MITRE ATT&CK + review SOC 2 / law-firm compliance',
      ]},
      { title: 'M4 — Security architecture', summary: 'IaC, zero-trust, posture management.', items: [
        'Deploy app via IaC, scan & fix misconfigs',
        'Sit CCSK exam',
      ]},
      { title: 'M5 — Vendor specialty deep dive', summary: 'Build a hardened reference lab.', items: [
        'Build a hardened reference environment lab (WAF, KMS, least-priv, logging, GuardDuty, SCP)',
      ]},
      { title: 'M6 — Specialty exam + attacker review', summary: 'Sit the exam, then attack your own lab.', items: [
        'Sit AWS Security Specialty (or AZ-500)',
        'Attack your own lab',
        'Write client-facing reference-architecture one-pager',
      ]},
    ],
  },
  {
    slug: 'ai-red-teaming',
    title: 'AI Red Teaming',
    subtitle: 'Attack, document, prove the product',
    accentColor: 'rose',
    estDuration: '≈6 months',
    description: 'Systematically attack any AI/LLM app across the full vulnerability taxonomy, document against industry frameworks, and build automated red-team pipelines.',
    modules: [
      { title: 'Certifications', summary: 'The field’s first real offensive-AI cert.', items: [
        'Pass HTB Certified Offensive AI Expert (COAE)',
      ]},
      { title: 'M1 — Adversarial ML + taxonomy', summary: 'OWASP LLM Top 10, ASI, evasion attacks.', items: [
        'Memorize OWASP LLM Top 10 + ASI list',
        'Reproduce a basic evasion attack',
        'Start HTB AI Red Teamer Path',
      ]},
      { title: 'M2 — Prompt injection mastery', summary: 'Direct + indirect injection, prompt leakage.', items: [
        'Demo direct prompt injection',
        'Demo indirect (RAG-poisoning) injection',
        'Demonstrate system-prompt leakage',
      ]},
      { title: 'M3 — RAG, agent & data attacks', summary: 'Vector attacks, excessive agency, extraction.', items: [
        'Execute RAG/vector attack',
        'Find excessive-agency findings on an agent',
        'Run membership-inference or model-extraction experiment',
      ]},
      { title: 'M4 — Automated red teaming', summary: 'Garak, PyRIT, promptfoo, DeepTeam.', items: [
        'Operate Garak, PyRIT, promptfoo & DeepTeam',
        'Build a reusable automated red-team harness (framework-mapped report)',
      ]},
      { title: 'M5 — Full engagements + reporting', summary: 'Client-grade reports; COAE prep.', items: [
        'Run a complete mock engagement + produce a client-grade report',
        'COAE prep',
      ]},
      { title: 'M6 — COAE + productize', summary: 'Sit the exam, ship the offering.', items: [
        'Sit HTB COAE exam',
        'Turn harness + report into a CloudGuard assessment offering',
        'Publish a public technical write-up',
      ]},
    ],
  },
  {
    slug: 'consulting-business',
    title: 'AI Consulting Business',
    subtitle: 'Ground-up: niche → offer → scale',
    accentColor: 'amber',
    estDuration: 'Ground-up',
    description: 'Niche → Offer → Proof → Pipeline → Sales → Delivery → Systemize → Scale. Sell what you can reliably deliver; productize ruthlessly.',
    modules: [
      { title: 'Phase 0 — Foundation & positioning', summary: 'Get this wrong and everything downstream is harder.', items: [
        'Pick one vertical + one core problem',
        'Define the offer ladder (Assessment → Strategy → Pilot → Retainer)',
        'Set fixed-fee pricing + delivery model',
      ]},
      { title: 'Phase 1 — Legal/financial/ops setup', summary: 'Lean scaffolding; don’t gold-plate.', items: [
        'Form LLC + get EIN',
        'Open business banking + start bookkeeping',
        'Get MSA/SOW/NDA/DPA templates + E&O insurance',
        'Stand up CRM + delivery + proposal tooling',
      ]},
      { title: 'Phase 2 — Brand, proof & first clients', summary: '1–3 paying clients + proof assets.', items: [
        'Ship one-page niche website + LinkedIn positioning',
        'Build demos + run 1–2 discounted pilots + collect testimonials',
        'Launch lead-gen channels (warm → cold → Upwork → content → partnerships)',
        'Productize the sales process (discovery → ROI proposal → close → onboard)',
      ]},
      { title: 'Phase 3 — Delivery, retention & scale', summary: 'Recurring revenue is the whole game.', items: [
        'Document a repeatable delivery methodology',
        'Land first monthly retainer',
        'Write SOPs for sales/onboarding/delivery',
        'Raise rates + specialize upward (governance/compliance)',
      ]},
    ],
  },
];

async function main() {
  for (let t = 0; t < TRACKS.length; t++) {
    const trk = TRACKS[t];
    const trackId = `t-${trk.slug}`;
    await prisma.learningTrack.upsert({
      where: { id: trackId },
      update: {
        slug: trk.slug, title: trk.title, subtitle: trk.subtitle,
        description: trk.description, accentColor: trk.accentColor,
        estDuration: trk.estDuration, sortOrder: t,
      },
      create: {
        id: trackId, slug: trk.slug, title: trk.title, subtitle: trk.subtitle,
        description: trk.description, accentColor: trk.accentColor,
        estDuration: trk.estDuration, sortOrder: t,
      },
    });

    for (let m = 0; m < trk.modules.length; m++) {
      const mod = trk.modules[m];
      const moduleId = `m-${trk.slug}-${m}`;
      await prisma.learningModule.upsert({
        where: { id: moduleId },
        update: { trackId, title: mod.title, summary: mod.summary, sortOrder: m },
        create: { id: moduleId, trackId, title: mod.title, summary: mod.summary, sortOrder: m },
      });

      for (let i = 0; i < mod.items.length; i++) {
        const itemId = `i-${trk.slug}-${m}-${i}`;
        await prisma.learningItem.upsert({
          where: { id: itemId },
          update: { moduleId, title: mod.items[i], sortOrder: i },
          create: { id: itemId, moduleId, title: mod.items[i], sortOrder: i },
        });
      }
    }
  }

  const counts = {
    tracks: await prisma.learningTrack.count(),
    modules: await prisma.learningModule.count(),
    items: await prisma.learningItem.count(),
  };
  console.log('[seed-learning] done:', counts);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
