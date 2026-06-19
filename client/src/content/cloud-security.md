# Cloud Security Roadmap — Fundamentals, Certs, and Hands-On Defense

**Why this matters for you specifically:** CloudGuard sells AI security to data-sensitive law firms. You can't credibly sell cloud + AI security if you can't speak fluently about IAM, network isolation, encryption, and shared responsibility. This roadmap makes you dangerous in a sales conversation *and* gives you the foundation the AI red-teaming work sits on top of. Your co-founder Abe owns engineering delivery — your job here is enough depth to architect, scope, and defend, not to run the SOC.

**Definition of done (≈6 months):** you understand cloud security from first principles, you hold one foundational cert + one cloud-specific cert, and you've personally hardened (and attacked) a cloud environment in a lab so the concepts are muscle memory, not flashcards.

## The cert track (the spine of this roadmap)

The established progression: **Security+ → cloud-specific specialty → CCSP (later, when you have experience).**

1. **CompTIA Security+ (SY0-701)** — the entry standard. Vendor-neutral core: network security, threat detection, risk management, crypto, IAM, cloud fundamentals. The 2026 refresh added basic prompt-injection and AI-aware threat questions. **Target: Month 2–3.** Non-negotiable as a foundation and a résumé line.
2. **CCSK (Certificate of Cloud Security Knowledge)** — Cloud Security Alliance, vendor-neutral, **open-book online exam (~$445, 80% to pass).** Best value-per-dollar credential in cloud security; explicitly prepares you for CCSP later. Covers IAM, incident response, app security, and cloud architecture across all providers. **Target: Month 3–4.**
3. **One cloud-specific specialty — pick the cloud CloudGuard's clients actually use (likely AWS):**
   - **AWS Certified Security – Specialty (SCS-C03)** — AWS replaced SCS-C02 with **SCS-C03 in December 2025**, so use only current materials. Covers GuardDuty, Config, Security Hub, KMS, IAM deep-dive, detection, incident response. **Target: Month 5–6.**
   - *Or* **Microsoft Azure: AZ-500 (Security Engineer Associate)** + later **SC-100** if your clients are Microsoft shops.
4. **CCSP (ISC2)** — the senior credential. **Don't chase this in 6 months** — it expects real experience. Bank it as a 1–2 year goal.

> **Pick one cloud and go deep.** Cross-cloud concepts come from CCSK; depth comes from one vendor specialty.

## Core mental models to internalize before anything else

- **Shared Responsibility Model** — what the cloud provider secures vs. what you secure. The #1 source of real breaches.
- **CIA triad** — confidentiality, integrity, availability as the lens for every control.
- **Least privilege & IAM** — identity is the new perimeter. Most cloud breaches are identity/permission failures.
- **Defense in depth** — layered controls so one failure isn't catastrophic.
- **The blast radius mindset** — assume compromise; design so the damage is contained.

## Month 1 — Cloud + networking + security fundamentals

**Curriculum**
- Cloud computing basics: IaaS/PaaS/SaaS, regions/AZs, the core compute/storage/network/identity services.
- Networking for security: TCP/IP, DNS, HTTP/S, TLS, ports, firewalls, VPCs/subnets, security groups vs. NACLs, public vs. private subnets, VPNs.
- Security foundations: CIA triad applied, authentication vs. authorization, symmetric vs. asymmetric crypto, hashing, certificates/PKI.
- Start **Security+** study (Professor Messer's free SY0-701 course; pair with the official study guide).

**Build / hands-on**
- Open a free-tier AWS account. Set up MFA on root, create IAM users/roles, build a VPC with public and private subnets by hand. Break it, fix it.

**Milestone:** you can draw a secure VPC on a whiteboard and explain why the database lives in the private subnet.

## Month 2 — Identity, access, and data protection

**Curriculum**
- IAM deep-dive (your most important cloud-security topic): users, groups, roles, policies, policy evaluation logic, assume-role, federation/SSO, temporary credentials.
- Data protection: encryption at rest vs. in transit, key management (KMS / Key Vault), secrets management, S3 bucket security, data classification.
- Logging and monitoring foundations: CloudTrail / Azure Monitor, what gets logged, why audit trails matter.

**Build / hands-on**
- Write least-privilege IAM policies from scratch. Create an over-permissioned role, then tighten it.
- Enable CloudTrail, generate activity, read the logs. Set up an encrypted S3 bucket with proper access controls and block-public-access.

**Milestone:** **Sit Security+** late this month or early Month 3. You can explain how a leaked access key becomes a full account compromise and how to prevent it.

## Month 3 — Threats, detection, and incident response

**Curriculum**
- Threat landscape: credential theft, misconfiguration, public exposure, lateral movement, data exfiltration. Map them to the MITRE ATT&CK framework.
- Detection services: GuardDuty, Security Hub, AWS Config (or Azure Defender / Sentinel).
- Incident response lifecycle: prepare → detect → contain → eradicate → recover → lessons learned. Cloud-specific IR (isolating instances, snapshotting for forensics, rotating credentials).
- Compliance frameworks relevant to your clients: SOC 2, and for law firms — confidentiality obligations, data residency, "where does the data go." Direct sales ammunition.

**Build / hands-on**
- Enable GuardDuty, trigger sample findings, triage them.
- Start **CCSK** study (open-book — study for understanding, not memorization).

**Milestone:** you can walk a prospect through "here's how we'd detect and contain a breach in your environment" without bluffing.

## Month 4 — Cloud security architecture + CCSK

**Curriculum**
- Secure architecture patterns: network segmentation, zero-trust principles, secure landing zones, secrets handling in CI/CD, securing serverless and containers.
- DevSecOps basics: shifting security left, IaC security (scanning Terraform/CloudFormation), policy-as-code.
- Posture management: CSPM tools, how config drift creates risk.
- Governance: tagging, account structure, guardrails (SCPs/Azure Policy).

**Build / hands-on**
- Deploy a small app stack via IaC, then scan it for misconfigurations and fix them.
- **Sit the CCSK exam.**

**Milestone:** you can design a defensible cloud architecture for a small law firm and name the controls at each layer.

## Month 5 — AWS Security Specialty (or Azure AZ-500) deep dive

**Curriculum**
- Full vendor specialty syllabus for SCS-C03 (or AZ-500): detection, IR, infrastructure security, IAM, data protection, management & governance — at depth.
- Hands-on with every service the exam covers: GuardDuty, Detective, Macie, Inspector, KMS, Secrets Manager, WAF, Shield, Config, Security Hub, Organizations/SCPs.

**Build / hands-on**
- Build a "secured reference environment" lab: a multi-tier app with WAF, encrypted data, least-privilege IAM, logging, GuardDuty, and an SCP guardrail. Document it. This becomes a CloudGuard demo asset.

**Milestone:** you're exam-ready on the vendor specialty and you have a hardened reference architecture you built yourself.

## Month 6 — Specialty exam + attacker's-eye review + integration

**Curriculum / activity**
- **Sit the AWS Security Specialty (or AZ-500) exam.**
- Attacker's-eye review: take your hardened lab and try to break it. Misconfigure something on purpose and see what your detection catches.
- Tie it together for CloudGuard: write up your reference architecture and threat model as a client-facing one-pager.

**Milestone:** two cloud-security certs in hand, a hardened-and-tested lab environment, and the ability to architect, defend, and scope cloud security for the exact clients CloudGuard targets.

## How to not fail this

- **Hands-on beats reading, always.** Every concept gets reproduced in a free-tier account.
- **CCSK is your secret weapon** — open-book, cheap relative to its credibility, the conceptual frame for everything cloud-security.
- **Map everything to CloudGuard's clients.** Law firms care about confidentiality, data residency, and "who can see our data."
- **Don't skip IAM.** It's the unglamorous core where real breaches happen.
- **This roadmap and the red-teaming one are siblings** — threat-modeling, MITRE ATT&CK, and "attack your own lab" are the seam between them.
