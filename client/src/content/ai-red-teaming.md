# AI Red Teaming & AI Security Vulnerabilities Roadmap

**This is the one closest to CloudGuard's core.** You already have the foundation — CIA triad, prompt-injection mechanics, red-teaming methodology, and the tooling trio (Garak, PyRIT, promptfoo). This roadmap takes you from "knows the concepts well enough to sell" to "can actually run an AI red-team engagement, find real vulnerabilities, and prove the product works."

**Definition of done (≈6 months):** you can take any AI/LLM application, systematically attack it across the full vulnerability taxonomy, document findings against industry frameworks, build automated red-team pipelines, and translate results into both a remediation plan and a sales narrative. You hold the field's first real offensive-AI certification.

## The frameworks that are your shared language

Memorize these cold — they're how you report findings to clients and how exams test you.

- **OWASP Top 10 for LLM Applications (2025 edition)** — the de facto taxonomy. Know all ten codes and a one-line mitigation for each:
  - **LLM01 Prompt Injection** (the #1 exploited vuln in production — direct and indirect)
  - **LLM02 Sensitive Information Disclosure**
  - **LLM03 Supply Chain**
  - **LLM04 Data and Model Poisoning**
  - **LLM05 Improper Output Handling**
  - **LLM06 Excessive Agency**
  - **LLM07 System Prompt Leakage**
  - **LLM08 Vector and Embedding Weaknesses** (RAG-specific)
  - **LLM09 Misinformation**
  - **LLM10 Unbounded Consumption**
- **OWASP Top 10 for Agentic Applications (ASI, released December 2025)** — the newer agent-specific layer. The official prefix is **ASI** (Agentic Security Issue). Key new classes: Agent Goal Hijack (ASI01), plus runtime composition and multi-agent risks.
- **MITRE ATLAS** — ATT&CK-style adversarial matrix for AI systems. The tactics/techniques vocabulary for threat modeling.
- **NIST AI RMF — GenAI Profile (NIST AI 600-1)** — the US baseline; twelve GenAI-specific risks with mitigations.
- **Google SAIF (Secure AI Framework)** — the framework the leading AI red-team cert aligns to.

## The cert track (this field's certs are brand-new — that's an advantage)

1. **HTB Certified Offensive AI Expert (COAE)** — **launched April 2, 2026**, the capstone of Hack The Box's AI Red Teamer Job-Role Path (built with Google, aligned to SAIF). **Hands-on and practical — not multiple choice** — covering adversarial ML (FGSM, DeepFool, JSMA), prompt injection, model extraction, data poisoning, membership inference, and AI defense. ~$210 standalone or ~$490 Silver Annual. **This is your headline credential — target Month 5–6.** Work the full AI Red Teamer Path on HTB Academy as your spine through Months 1–5.
2. **SANS / GIAC offensive-AI certs** — four AI-focused certifications landing by end of 2026 (e.g., **SEC535: Offensive AI**, **SEC545: GenAI and LLM Application Security**). Premium-priced; Phase-2 goal.
3. **Supporting context certs** — AIF-C01, Security+/CCSP 2026 refreshes added AI threat content. They compound but aren't the focus.

> Reality check: the HTB AI red-teaming CTF with HackerOne saw **fewer than half of participants solve even one challenge.** The skills gap is real and wide. That's the opportunity.

## Month 1 — Adversarial ML foundations + the taxonomy

**Curriculum**
- Lock in the frameworks above — OWASP LLM Top 10 and ASI especially, to recall-level.
- Adversarial ML theory: how ML models fail under adversarial input. Evasion attacks (FGSM, I-FGSM, DeepFool, JSMA), the intuition behind perturbations.
- The AI attack surface end to end: training data → model → inference API → app layer → tools/agents → infrastructure.
- Start the **HTB AI Red Teamer Path** (Introduction to Red Teaming AI module first).

**Build / hands-on**
- Reproduce a basic evasion attack on an image classifier in a notebook (perturb an input, fool the model).

**Milestone:** you can recite the OWASP LLM Top 10 with mitigations and explain how an adversarial perturbation works mechanically.

## Month 2 — Prompt injection mastery (your core product domain)

**Curriculum**
- **Direct prompt injection:** instruction overrides, role-play jailbreaks, encoding/obfuscation tricks, multi-turn manipulation, context-window attacks.
- **Indirect prompt injection** (the dangerous one): adversarial instructions hidden in content the model *retrieves* — web pages, documents, emails, calendar events, RAG sources, API responses.
- **System prompt leakage (LLM07):** extracting the hidden system prompt, why early deployments leak credentials/business logic.
- **Jailbreak taxonomy:** known families, why they work, why patching them is whack-a-mole.
- Defenses: input/output filtering, instruction hierarchy, privilege separation, guardrails, the "treat all input as untrusted instructions" principle.

**Build / hands-on**
- Build a deliberately vulnerable LLM app, then attack it through both direct and indirect channels. Document each successful injection.
- Set up an indirect-injection demo: poison a document in a RAG corpus and watch it hijack the model. **This is a killer CloudGuard sales demo** — capture it.

**Milestone:** you can demonstrate direct *and* indirect prompt injection live and explain the defense for each.

## Month 3 — RAG, agent, and data attacks

**Curriculum**
- **RAG/vector attacks (LLM08):** embedding poisoning, retrieval manipulation, cross-tenant data leakage through shared vector stores, context injection via retrieved chunks.
- **Excessive agency & agent attacks (LLM06 / ASI):** Agent Goal Hijack, tool-permission abuse, blast-radius analysis when an agent has too much access.
- **Data and model poisoning (LLM04):** training-data poisoning, backdoors, fine-tuning attacks.
- **Model extraction & membership inference:** stealing model behavior via queries, inferring whether specific data was in training (privacy attack — relevant to law-firm confidentiality concerns).

**Build / hands-on**
- Build an agent with real tools, then red-team it: get it to exceed its intended scope. Document the excessive-agency findings.
- Run a membership-inference or model-extraction experiment on a small model.

**Milestone:** you can threat-model an agentic system and identify where autonomy creates blast radius.

## Month 4 — Automated red teaming & tooling

**Curriculum & hands-on**
- **Garak** — run the LLM vulnerability scanner properly: configure probes, interpret results, map to OWASP categories.
- **PyRIT** — orchestrate automated adversarial conversations, build attack pipelines.
- **promptfoo** — adversarial testing *and* regression (does a fix actually hold?).
- **DeepTeam** and framework-based testing — run an OWASP-Top-10 or ASI assessment programmatically.
- Build the four-component program model: (1) automated baseline suite on every deploy, (2) scheduled human red-team cadence, (3) findings-to-remediation loop, (4) continuous re-testing. **Continuous, not one-shot.**

**Build**
- A reusable **automated AI red-team harness** — point it at an endpoint, run the OWASP/ASI battery via Garak + PyRIT + promptfoo, output a findings report mapped to the frameworks. Your portfolio centerpiece *and* CloudGuard's product MVP.

**Milestone:** you can run a full automated assessment against an LLM app and produce a framework-mapped findings report without hand-holding.

## Month 5 — Full engagements + reporting + COAE prep

**Curriculum**
- The full red-team engagement lifecycle: scoping, rules of engagement, threat modeling the target, executing across the taxonomy, evidence collection, severity rating, remediation guidance, retest.
- **Professional reporting:** translating "I jailbroke the chatbot" into an executive-readable risk report with business impact, framework mapping, and prioritized fixes.
- Cloud guardrails as defenses: Bedrock Guardrails, Azure AI Content Safety, Model Armor — what they catch (and miss).
- Heavy **HTB AI Red Teamer Path** completion + COAE practice.

**Build**
- Run a complete mock engagement end to end against a realistic target app. Produce a polished AI red-team report.

**Milestone:** you've completed a full engagement with a client-grade report. You're COAE-ready.

## Month 6 — COAE + productize + position

**Activity**
- **Sit the HTB COAE exam** (hands-on, assess-a-real-environment format).
- Turn your harness + report template into CloudGuard's actual productized assessment offering — define the SKU, the deliverable, the price.
- Write a public technical artifact (a blog post or demo walkthrough of an indirect-injection attack and defense).
- Threat-model the AI stack your target law firms actually use and build a tailored pitch around the specific risks.

**Milestone:** certified offensive-AI expert, a working automated red-team product, a client-grade reporting process, and public proof of expertise.

## How to not fail this

- **Attack things constantly.** This field is learned by breaking, not reading.
- **Indirect prompt injection is your money shot.** Most-exploited, least-understood-by-buyers vuln.
- **Continuous > one-shot.** The defensible business is continuous testing through model/prompt/tool changes.
- **Your sales brain is an asset here.** Most red-teamers can't write a finding a CEO understands. You can.
- **Stay current — this taxonomy moves quarterly.** Follow OWASP GenAI, MITRE ATLAS updates, and HTB releases.
- **These three roadmaps interlock.** Build, secure, and attack AI systems — exactly the founder CloudGuard needs.
