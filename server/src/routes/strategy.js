const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// Simple rate limit: one brief per hour per user (stored in memory, resets on restart).
const briefCooldowns = new Map();
const COOLDOWN_MS = 60 * 60 * 1000;

router.post('/brief', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const lastCall = briefCooldowns.get(userId);
  if (lastCall && Date.now() - lastCall < COOLDOWN_MS) {
    const waitMin = Math.ceil((COOLDOWN_MS - (Date.now() - lastCall)) / 60000);
    return res.status(429).json({ error: `Brief available in ${waitMin} minute(s).` });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Anthropic API key not configured.' });
  }

  // Gather context from across the app.
  const [tasks, clients, finance, objectives, milestones] = await Promise.all([
    prisma.task.findMany({ select: { status: true, priority: true, dueDate: true } }),
    prisma.client.findMany({ select: { name: true, status: true } }),
    prisma.financeEntry.findMany({ select: { type: true, amount: true, status: true, date: true } }),
    prisma.objective.findMany({ include: { keyResults: true } }),
    prisma.milestone.findMany({ where: { date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 10 }),
  ]);

  const now = new Date();
  const taskSummary = {
    total: tasks.length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done').length,
    inProgress: tasks.filter(t => t.status === 'InProgress').length,
    highPriority: tasks.filter(t => t.priority === 'High').length,
  };

  const revenue = finance
    .filter(f => f.type === 'income' && f.date >= new Date(now.getFullYear(), now.getMonth(), 1))
    .reduce((s, f) => s + Number(f.amount), 0);

  const outstanding = finance
    .filter(f => f.status === 'Pending' || f.status === 'Overdue')
    .reduce((s, f) => s + Number(f.amount), 0);

  const activeClients = clients.filter(c => c.status === 'Active').length;
  const leads = clients.filter(c => c.status === 'Lead').length;

  const prompt = `You are the strategic director of Norwall Solutions, a 3-person AI red teaming and prompt-injection security consultancy.

Current business snapshot:
- Tasks: ${taskSummary.total} total, ${taskSummary.inProgress} in progress, ${taskSummary.overdue} overdue, ${taskSummary.highPriority} high priority
- Clients: ${activeClients} active, ${leads} in lead stage
- Finance: $${revenue.toFixed(0)} revenue this month, $${outstanding.toFixed(0)} outstanding
- Objectives: ${objectives.length} active OKRs
- Upcoming milestones: ${milestones.slice(0, 3).map(m => m.title).join(', ') || 'none'}

Provide a concise executive business brief as JSON with this exact structure:
{
  "headline": "one sentence on the overall business pulse",
  "wins": ["2-3 brief positive observations based on the data"],
  "risks": ["2-3 potential concerns or risks that need attention"],
  "priorities": ["top 3 things the team should focus on this week"],
  "insight": "one strategic insight or recommendation for an AI security firm at this stage"
}

Be direct, specific, and useful. Use the numbers provided.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[strategy/brief] Anthropic error:', err);
    return res.status(502).json({ error: 'Failed to generate brief.' });
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  let brief;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    brief = JSON.parse(match ? match[0] : text);
  } catch {
    brief = { headline: text, wins: [], risks: [], priorities: [], insight: '' };
  }

  briefCooldowns.set(userId, Date.now());
  res.json({ brief, generatedAt: new Date().toISOString() });
}));

module.exports = router;
