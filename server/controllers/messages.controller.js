const { pool } = require("../db");
const messagesQueries = require("../queries/messages.queries");
const claimsQueries = require("../queries/claims.queries");

// GET /api/conversations - List conversations for a user
async function getConversations(req, res) {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        message: "Query parameter 'userId' is required.",
      });
    }

    const conversations = await messagesQueries.getConversationsForUser(pool, userId);

    return res.status(200).json({ conversations });
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return res.status(500).json({
      message: "Internal server error while fetching conversations.",
      error: err.message,
    });
  }
}

// POST /api/conversations - Find or create an item-related conversation thread
async function findOrCreateConversation(req, res) {
  try {
    const { itemId, participantOneId, participantTwoId } = req.body;

    if (!itemId || !participantOneId || !participantTwoId) {
      return res.status(400).json({
        message: "itemId, participantOneId, and participantTwoId are required.",
      });
    }

    if (participantOneId === participantTwoId) {
      return res.status(400).json({
        message: "Participants must be two different users.",
      });
    }

    // Check if item exists
    const item = await claimsQueries.getItemById(pool, itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Check if conversation already exists
    const existing = await messagesQueries.findExistingConversation(
      pool,
      itemId,
      participantOneId,
      participantTwoId
    );

    if (existing) {
      const fullConv = await messagesQueries.getConversationById(pool, existing.id);
      return res.status(200).json({
        message: "Existing conversation retrieved.",
        conversation: fullConv || existing,
        isExisting: true,
      });
    }

    // Create new conversation
    const newConvId = `CV${Date.now()}`;
    const newConv = await messagesQueries.createConversation(pool, {
      id: newConvId,
      itemId,
      participantOneId,
      participantTwoId,
      createdAt: new Date().toISOString(),
    });

    const fullConv = await messagesQueries.getConversationById(pool, newConvId);

    return res.status(201).json({
      message: "Conversation created successfully.",
      conversation: fullConv || newConv,
      isExisting: false,
    });
  } catch (err) {
    console.error("Error finding or creating conversation:", err);
    return res.status(500).json({
      message: "Internal server error while creating conversation.",
      error: err.message,
    });
  }
}

// GET /api/conversations/:id/messages - Load messages for a conversation
async function getMessages(req, res) {
  try {
    const { id } = req.params;
    const messages = await messagesQueries.getMessagesByConversation(pool, id);

    return res.status(200).json({ messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return res.status(500).json({
      message: "Internal server error while fetching messages.",
      error: err.message,
    });
  }
}

// POST /api/conversations/:id/messages - Send a message and notify recipient
async function sendMessage(req, res) {
  const { id } = req.params;
  const { itemId, senderId, receiverId, text } = req.body;

  if (!senderId || !receiverId || !text || !text.trim()) {
    return res.status(400).json({
      message: "senderId, receiverId, and non-empty text are required.",
    });
  }

  if (senderId === receiverId) {
    return res.status(400).json({
      message: "Sender and receiver cannot be the same user.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const messageId = `M${Date.now()}`;
    const msgData = {
      id: messageId,
      conversationId: id,
      itemId,
      senderId,
      receiverId,
      text: text.trim(),
      sentAt: new Date().toISOString(),
      read: false,
    };

    const inserted = await messagesQueries.insertMessage(client, msgData);

    // Get sender name for clear notification
    const senderRes = await client.query("SELECT name FROM users WHERE id = $1", [senderId]);
    const senderName = senderRes.rows[0]?.name || "Someone";

    // Insert in-app notification for receiver
    await claimsQueries.insertNotification(client, {
      id: `N${Date.now()}`,
      userId: receiverId,
      type: "Message",
      title: `Message from ${senderName}`,
      message: text.trim().length > 60 ? `${text.trim().substring(0, 57)}...` : text.trim(),
      relatedId: id,
      read: false,
    });

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Message sent successfully.",
      data: messagesQueries.formatMessage(inserted),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error sending message:", err);
    return res.status(500).json({
      message: "Internal server error while sending message.",
      error: err.message,
    });
  } finally {
    client.release();
  }
}

// PATCH /api/conversations/:id/read - Mark messages as read by recipient
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId of the reader is required.",
      });
    }

    const updatedCount = await messagesQueries.markMessagesAsRead(pool, id, userId);

    return res.status(200).json({
      message: "Messages marked as read.",
      updatedCount,
    });
  } catch (err) {
    console.error("Error marking messages as read:", err);
    return res.status(500).json({
      message: "Internal server error while marking messages as read.",
      error: err.message,
    });
  }
}

module.exports = {
  getConversations,
  findOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
};
