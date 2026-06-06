// Team Tasks: Kanban board CRUD + status/order moves.
const express = require('express');
const { body, param, query } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

const STATUSES = ['Backlog', 'InProgress', 'Review', 'Done'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const taskInclude = {
  assignee: { select: { id: true, username: true } },
  client: { select: { id: true, name: true } },
};

// List tasks, optionally filtered by assignee or client.
router.get(
  '/',
  [
    query('assigneeId').optional().isUUID(),
    query('clientId').optional().isUUID(),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.assigneeId) where.assigneeId = req.query.assigneeId;
    if (req.query.clientId) where.clientId = req.query.clientId;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
      include: taskInclude,
    });
    res.json({ tasks });
  })
);

router.post(
  '/',
  [
    body('title').isString().trim().notEmpty().withMessage('Title is required.'),
    body('description').optional().isString().trim(),
    body('assigneeId').optional({ nullable: true }).isUUID(),
    body('clientId').optional({ nullable: true }).isUUID(),
    body('status').optional().isIn(STATUSES),
    body('priority').optional().isIn(PRIORITIES),
    body('dueDate').optional({ nullable: true }).isISO8601(),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const { title, description, assigneeId, clientId, status, priority, dueDate } = req.body;

    const status_ = status || 'Backlog';
    const count = await prisma.task.count({ where: { status: status_ } });

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        assigneeId: assigneeId || null,
        clientId: clientId || null,
        status: status_,
        priority: priority || 'Medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        order: count,
      },
      include: taskInclude,
    });
    res.status(201).json({ task });
  })
);

router.patch(
  '/:id',
  [
    param('id').isUUID(),
    body('title').optional().isString().trim().notEmpty(),
    body('description').optional().isString().trim(),
    body('assigneeId').optional({ nullable: true }).custom((v) => v === null || /^[0-9a-f-]{36}$/i.test(v)),
    body('clientId').optional({ nullable: true }).custom((v) => v === null || /^[0-9a-f-]{36}$/i.test(v)),
    body('status').optional().isIn(STATUSES),
    body('priority').optional().isIn(PRIORITIES),
    body('dueDate').optional({ nullable: true }).custom((v) => v === null || !isNaN(Date.parse(v))),
    body('order').optional().isInt({ min: 0 }),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found.' });

    const data = {};
    const b = req.body;
    if (b.title !== undefined) data.title = b.title;
    if (b.description !== undefined) data.description = b.description;
    if (b.assigneeId !== undefined) data.assigneeId = b.assigneeId || null;
    if (b.clientId !== undefined) data.clientId = b.clientId || null;
    if (b.status !== undefined) data.status = b.status;
    if (b.priority !== undefined) data.priority = b.priority;
    if (b.dueDate !== undefined) data.dueDate = b.dueDate ? new Date(b.dueDate) : null;
    if (b.order !== undefined) data.order = b.order;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: taskInclude,
    });
    res.json({ task });
  })
);

router.delete(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  asyncHandler(async (req, res) => {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found.' });
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

module.exports = router;
