// Team Communications: message board with tags, @mentions, threaded replies.
const express = require('express');
const { body, param } = require('express-validator');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
router.use(requireAuth);

const TAGS = ['General', 'Urgent', 'Client', 'Technical'];

const authorSelect = { select: { id: true, username: true, role: true } };

// List top-level messages (newest first) with their nested replies.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const messages = await prisma.message.findMany({
      where: { parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        author: authorSelect,
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { author: authorSelect },
        },
      },
    });
    res.json({ messages });
  })
);

// Create a top-level message.
router.post(
  '/',
  [
    body('content').isString().trim().notEmpty().withMessage('Message content is required.')
      .isLength({ max: 5000 }).withMessage('Message too long.'),
    body('tag').optional().isIn(TAGS).withMessage('Invalid tag.'),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const { content, tag } = req.body;
    const message = await prisma.message.create({
      data: { content, tag: tag || 'General', authorId: req.user.id },
      include: { author: authorSelect, replies: true },
    });
    res.status(201).json({ message });
  })
);

// Reply to a message (one level of threading).
router.post(
  '/:id/replies',
  [
    param('id').isUUID().withMessage('Invalid message id.'),
    body('content').isString().trim().notEmpty().withMessage('Reply content is required.')
      .isLength({ max: 5000 }).withMessage('Reply too long.'),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const parent = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!parent) return res.status(404).json({ error: 'Parent message not found.' });
    if (parent.parentId) {
      return res.status(400).json({ error: 'Cannot reply to a reply.' });
    }

    const reply = await prisma.message.create({
      data: {
        content: req.body.content,
        tag: parent.tag,
        authorId: req.user.id,
        parentId: parent.id,
      },
      include: { author: authorSelect },
    });
    res.status(201).json({ message: reply });
  })
);

// Delete a message (author or admin only).
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid message id.')],
  handleValidation,
  asyncHandler(async (req, res) => {
    const message = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!message) return res.status(404).json({ error: 'Message not found.' });
    if (message.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own messages.' });
    }
    await prisma.message.delete({ where: { id: message.id } }); // cascades to replies
    res.json({ ok: true });
  })
);

module.exports = router;
