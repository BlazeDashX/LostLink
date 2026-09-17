const express = require("express");
const router = express.Router();
const messagesController = require("../controllers/messages.controller");
const { requireAuth } = require("../middleware/auth");

// GET /api/conversations?userId=... - List threads for user
router.get("/", requireAuth, messagesController.getConversations);

// POST /api/conversations - Find or create a conversation thread
router.post("/", requireAuth, messagesController.findOrCreateConversation);

// GET /api/conversations/:id - Get conversation thread metadata
router.get("/:id", requireAuth, messagesController.getConversationDetails);

// GET /api/conversations/:id/messages - Get messages in conversation
router.get("/:id/messages", requireAuth, messagesController.getMessages);

// POST /api/conversations/:id/messages - Send a message in conversation
router.post("/:id/messages", requireAuth, messagesController.sendMessage);

// PATCH /api/conversations/:id/read - Mark conversation messages as read
router.patch("/:id/read", requireAuth, messagesController.markAsRead);

module.exports = router;
