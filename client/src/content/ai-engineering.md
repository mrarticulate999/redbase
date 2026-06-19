# AI Engineering Roadmap — 0 to Full-Fledged AI Engineer in 6 Months

**Built for your starting point:** you already ship React/Vite/TS, you've wired up the Claude API, MCP servers, n8n/Make automations, and Supabase. That means you skip the "what is an API" phase entirely. The gap between you and a hireable AI engineer is **Python/ML fluency, the modern LLM application stack (RAG, agents, evals, fine-tuning), and production/MLOps muscle.** This plan front-loads building and treats theory as a tool, not a prerequisite.

**Definition of "full-fledged AI engineer" by month 6:** you can take a vague business problem, choose the right approach (prompt vs. RAG vs. fine-tune vs. agent), build it, evaluate it rigorously, deploy it behind an API with monitoring, and defend every design choice. You have a portfolio of 4–5 shipped systems and one cert that proves it on paper.

## The cert track (run in parallel, don't stop building for it)

The AWS ML Specialty (MLS-C01) **retired March 31, 2026** — ignore any guide that still recommends it. The current role-based path is:

1. **AWS Certified AI Practitioner (AIF-C01)** — ~$100, foundational, 2–3 weeks of evening prep for someone at your level. Get this in Month 1–2 as a confidence/vocabulary anchor. It covers AI/ML fundamentals, generative AI, responsible AI, and how AWS services fit together. It also now maps the OWASP LLM Top 10 to Bedrock Guardrails — directly useful for CloudGuard.
2. **AWS Certified Machine Learning Engineer – Associate (MLA-C01)** — the cert employers actually search for. Target Month 4–5. Validates the full ML lifecycle: data prep, modeling, deployment, MLOps on SageMaker. This is your headline credential.
3. **(Optional stretch) AWS Certified Generative AI Developer – Professional** — newest credential, in beta. Only worth it if GenAI is your declared specialty and you finished MLA early. Skip if time-constrained.

If you'd rather stay cloud-agnostic on the foundational piece, **Azure AI-900** is the equivalent of AIF-C01 and **AI-102** (Azure AI Engineer Associate) is a solid alternative headline cert. Pick one cloud and go deep — don't split.

## Month 1 — Python + ML foundations, fast

You're an EE student doing phasors and op-amps, so the math won't scare you. The goal here is *fluency in the tooling*, not deriving backprop from scratch.

**Curriculum**
- Python for data: NumPy, pandas, matplotlib. Do it by porting something — re-implement one of your circuits lab data analyses in pandas.
- The ML mental model: supervised vs. unsupervised, train/val/test split, overfitting, bias-variance, loss functions, gradient descent. Andrew Ng's *Machine Learning Specialization* (Coursera) is still the cleanest on-ramp.
- scikit-learn end to end: load data → split → train (linear/logistic regression, trees, random forest) → evaluate (precision/recall/F1/ROC-AUC) → tune.
- Just enough deep learning theory: what a neuron/layer/activation is, why transformers replaced RNNs (attention is the one concept to truly understand).

**Build**
- A classic tabular ML project end to end. Push to GitHub with a real README. This is your "I understand the fundamentals" artifact.
- Start the **AIF-C01** study in parallel (1–2 evenings/week).

**Milestone:** you can explain why a model is overfitting and three ways to fix it, and you've trained, evaluated, and saved a scikit-learn model.

## Month 2 — Deep learning + the transformer stack

**Curriculum**
- PyTorch basics: tensors, autograd, a training loop, datasets/dataloaders. (Pick PyTorch over TensorFlow.)
- Build a small neural net from scratch in PyTorch (MNIST or similar) so the training loop stops being magic.
- Transformers and embeddings: tokenization, attention, what "context window" actually means mechanically, embedding vectors and cosine similarity. Read Jay Alammar's "Illustrated Transformer," then Karpathy's "Let's build GPT" video — code along.
- Hugging Face ecosystem: `transformers`, `datasets`, loading a pretrained model, running inference.

**Build**
- Take a pretrained model from Hugging Face and run a real inference task (sentiment, summarization, NER), then wrap it in a FastAPI endpoint.
- Finish and **sit the AIF-C01 exam** this month if you're ready.

**Milestone:** you've written a PyTorch training loop by hand and you understand embeddings well enough to explain RAG before you build it.

## Month 3 — LLM application engineering (your wheelhouse, leveled up)

**Curriculum**
- Prompt engineering as a discipline: structured prompts, few-shot, chain-of-thought, output formatting/JSON mode, system vs. user roles. Read Anthropic's prompt engineering docs end to end.
- RAG properly: chunking strategies, embedding models, vector databases (start with pgvector since you already use Supabase), retrieval, re-ranking, context assembly. Understand *why* RAG beats fine-tuning for most knowledge problems.
- Function calling / tool use and the agent loop. Formalize the concepts: tool schemas, the observe-think-act loop, when agents fail.
- Frameworks: LangChain and LlamaIndex (learn the concepts, but many teams hand-roll — don't over-invest in framework lock-in).

**Build (this is a big one)**
- **A production-grade RAG system** over a real document corpus — for CloudGuard, make it RAG over AI-security/OWASP content so it doubles as a sales/research tool. Use Supabase + pgvector, your own chunking, a real retrieval pipeline, and a chat UI in React. Add source citations.

**Milestone:** you can articulate the prompt → RAG → fine-tune → agent decision tree and you've shipped a RAG app with citations.

## Month 4 — Agents, evals, and fine-tuning

**Curriculum**
- Agentic systems: multi-step tool-using agents, planning, memory, the failure modes (loops, hallucinated tool calls, cost blowups).
- **Evals — the skill that separates engineers from prompt-tinkerers.** How to build an eval set, LLM-as-judge, golden datasets, regression testing prompts, measuring RAG quality (faithfulness, relevance, context precision). Learn promptfoo and the eval mindset deeply. *Most candidates can't do this — make it your edge.*
- Fine-tuning: when it's actually worth it (style/format/domain tone, not knowledge injection), LoRA/QLoRA, parameter-efficient methods, dataset prep. Run one real fine-tune of a small open model.
- Cost and latency engineering: token budgeting, caching, model routing, streaming.

**Build**
- A **tool-using agent** that does something genuinely useful, wired to real tools with guardrails.
- An **eval harness** for one of your earlier projects — show before/after metrics in the README.
- Start **MLA-C01** prep in earnest.

**Milestone:** you can prove a system got better with numbers, not vibes. You've fine-tuned a model and know when *not* to.

## Month 5 — MLOps, deployment, and production hardening

**Curriculum**
- Deployment patterns: containerize with Docker, deploy to a cloud (SageMaker endpoints, or ECS/Lambda/a GPU host).
- MLOps lifecycle: experiment tracking (W&B or MLflow), model versioning, CI/CD for ML, monitoring (latency, cost, drift, output quality in prod).
- Observability for LLM apps: logging prompts/outputs, tracing (LangSmith or similar), catching regressions in prod.
- Responsible AI / safety basics: guardrails, content filtering, PII handling, prompt-injection defense at the app layer.

**Build**
- Take your best earlier project and **productionize it fully**: Docker, deployed endpoint, monitoring dashboard, cost tracking, basic guardrails.
- **Sit the MLA-C01 exam** this month.

**Milestone:** you have a live, monitored, deployed AI system with a public URL and a dashboard showing real metrics.

## Month 6 — Capstone + portfolio + positioning

**Build — the capstone**
- One ambitious, end-to-end system that combines RAG + agents + evals + deployment + monitoring. The obvious choice ties to CloudGuard: an **AI security assessment tool** that ingests a target's setup, runs structured probes, evaluates responses against OWASP LLM Top 10, and produces a report.

**Portfolio polish**
- Clean GitHub: 4–5 strong repos, each with a README explaining problem, architecture, decisions, and metrics.
- A short write-up per project. Update LinkedIn/resume with the cert + projects framed around outcomes.

**Milestone:** you can whiteboard a RAG-vs-agent design tradeoff and point to a deployed system that proves you've done it.

## How to not fail this

- **Build first, theory on demand.**
- **Ship public.** Every project gets a GitHub repo and ideally a live URL.
- **Evals are your moat.** Almost nobody early-career can rigorously evaluate an LLM system.
- **One cloud, one framework.** AWS + PyTorch + your existing JS stack is a complete, hireable combination.
- **Use CloudGuard as the project sandbox.** Every system can serve double duty as a product asset or sales tool.
