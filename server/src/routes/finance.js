// Finance: income/expense entries, KPI summary, monthly chart data, CSV export.
const express = require('express');
const { body, param, query } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

const TYPES = ['income', 'expense'];
const STATUSES = ['Paid', 'Pending', 'Overdue'];

const entryInclude = { client: { select: { id: true, name: true } } };

function toNum(decimal) {
  return Number(decimal);
}

// List all finance entries (optionally filtered by type).
router.get(
  '/',
  [query('type').optional().isIn(TYPES)],
  handleValidation,
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.type) where.type = req.query.type;
    const entries = await prisma.financeEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      include: entryInclude,
    });
    res.json({ entries: entries.map((e) => ({ ...e, amount: toNum(e.amount) })) });
  })
);

// KPI summary + monthly series for charts.
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const entries = await prisma.financeEntry.findMany();

    const now = new Date();
    const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    let monthlyRevenue = 0;
    let totalExpenses = 0;
    let totalIncome = 0;
    let outstandingInvoices = 0;
    const monthly = {}; // key -> { month, income, expense }

    for (const e of entries) {
      const amount = toNum(e.amount);
      const d = new Date(e.date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { month: key, income: 0, expense: 0 };

      if (e.type === 'income') {
        totalIncome += amount;
        monthly[key].income += amount;
        if (key === monthKey) monthlyRevenue += amount;
        if (e.status === 'Pending' || e.status === 'Overdue') outstandingInvoices += amount;
      } else {
        totalExpenses += amount;
        monthly[key].expense += amount;
      }
    }

    const profit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

    const series = Object.values(monthly)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({ ...m, profit: m.income - m.expense }));

    res.json({
      summary: {
        monthlyRevenue,
        outstandingInvoices,
        totalExpenses,
        totalIncome,
        profit,
        profitMargin: Math.round(profitMargin * 10) / 10,
      },
      monthly: series,
    });
  })
);

// CSV export of all entries.
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const entries = await prisma.financeEntry.findMany({
      orderBy: { date: 'desc' },
      include: entryInclude,
    });

    const headers = ['date', 'type', 'client', 'amount', 'category', 'description', 'invoiceNumber', 'status'];
    const escape = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = entries.map((e) =>
      [
        new Date(e.date).toISOString().slice(0, 10),
        e.type,
        e.client?.name || '',
        toNum(e.amount).toFixed(2),
        e.category,
        e.description,
        e.invoiceNumber || '',
        e.status || '',
      ].map(escape).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="redbase-finance.csv"');
    res.send(csv);
  })
);

router.post(
  '/',
  [
    body('type').isIn(TYPES).withMessage('Type must be income or expense.'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),
    body('date').optional().isISO8601(),
    body('clientId').optional({ nullable: true }).isUUID(),
    body('category').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('invoiceNumber').optional().isString().trim(),
    body('status').optional({ nullable: true }).isIn(STATUSES),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const b = req.body;
    if (b.type === 'income' && !b.status) {
      return res.status(400).json({ error: 'Income entries require a status (Paid/Pending/Overdue).' });
    }

    const entry = await prisma.financeEntry.create({
      data: {
        type: b.type,
        amount: b.amount,
        date: b.date ? new Date(b.date) : new Date(),
        clientId: b.clientId || null,
        category: b.category || (b.type === 'income' ? 'Consulting' : 'General'),
        description: b.description || '',
        invoiceNumber: b.type === 'income' ? b.invoiceNumber || null : null,
        status: b.type === 'income' ? b.status : null,
      },
      include: entryInclude,
    });
    res.status(201).json({ entry: { ...entry, amount: toNum(entry.amount) } });
  })
);

router.delete(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const existing = await prisma.financeEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Entry not found.' });
    await prisma.financeEntry.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

module.exports = router;
