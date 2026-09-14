const express = require("express");
const router = express.Router();
const messagesController = require("../controllers/messages.controller");

// GET /api/conversations?userId=... - List threads for user
router.get("/", messagesController.getConversations);

// POST /api/conversations - Find or create a conversation thread
router.post("/", messagesController.findOrCreateConversation);

// GET /api/conversations/:id/messages - Get messages in conversation
router.get("/:id/messages", messagesController.getMessages);

// POST /api/conversations/:id/messages - Send a message in conversation
router.post("/:id/messages", messagesController.sendMessage);

// PATCH /api/conversations/:id/read - Mark conversation messages as read
router.patch("/:id/read", messagesController.markAsRead);

module.exports = router;
