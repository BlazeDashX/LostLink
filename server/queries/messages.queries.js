const { pool } = require("../db");

// Format a raw message row to client camelCase
function formatMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    itemId: row.item_id,
    senderId: row.sender_id,
    senderName: row.sender_name || null,
    senderAvatar: row.sender_avatar || null,
    receiverId: row.receiver_id,
    receiverName: row.receiver_name || null,
    text: row.text,
    sentAt: row.sent_at,
    read: row.read,
  };
}

// Get all conversation threads for a specific user with unread counts and latest message
async function getConversationsForUser(clientOrPool, userId) {
  const query = `
    WITH latest_msg AS (
      SELECT DISTINCT ON (conversation_id)
        id,
        conversation_id,
        item_id,
        sender_id,
        receiver_id,
        text,
        sent_at,
        read
      FROM messages
      ORDER BY conversation_id, sent_at DESC
    ),
    unread_counts AS (
      SELECT 
        conversation_id,
        COUNT(*) AS unread_count
      FROM messages
      WHERE receiver_id = $1 AND read = FALSE
      GROUP BY conversation_id
    )
    SELECT 
      c.id AS conversation_id,
      c.item_id,
      c.participant_one_id,
      c.participant_two_id,
      c.created_at AS conversation_created_at,
      
      -- Item Details
      i.title AS item_title,
      i.type AS item_type,
      i.status AS item_status,
      i.image AS item_image,
      i.location AS item_location,
      i.reporter_id AS item_reporter_id,

      -- Other Participant Details (the one that is not $1)
      u.id AS other_user_id,
      u.name AS other_user_name,
      u.avatar AS other_user_avatar,
      u.email AS other_user_email,
      u.phone AS other_user_phone,
      u.role AS other_user_role,

      -- Latest Message Details
      lm.id AS last_message_id,
      lm.text AS last_message_text,
      lm.sent_at AS last_message_sent_at,
      lm.read AS last_message_read,
      lm.sender_id AS last_message_sender_id,
      lm.receiver_id AS last_message_receiver_id,

      -- Accurate Unread Count
      COALESCE(uc.unread_count, 0) AS unread_count

    FROM conversations c
    JOIN items i ON c.item_id = i.id
    JOIN users u ON u.id = CASE 
      WHEN c.participant_one_id = $1 THEN c.participant_two_id 
      ELSE c.participant_one_id 
    END
    LEFT JOIN latest_msg lm ON lm.conversation_id = c.id
    LEFT JOIN unread_counts uc ON uc.conversation_id = c.id
    WHERE c.participant_one_id = $1 OR c.participant_two_id = $1
    ORDER BY COALESCE(lm.sent_at, c.created_at) DESC;
  `;

  const result = await clientOrPool.query(query, [userId]);

  return result.rows.map((row) => ({
    conversationId: row.conversation_id,
    id: row.conversation_id,
    itemId: row.item_id,
    item: {
      id: row.item_id,
      title: row.item_title,
      type: row.item_type,
      status: row.item_status,
      image: row.item_image,
      location: row.item_location,
      reporterId: row.item_reporter_id,
    },
    participant: {
      id: row.other_user_id,
      name: row.other_user_name,
      avatar: row.other_user_avatar,
      email: row.other_user_email,
      phone: row.other_user_phone,
      role: row.other_user_role,
    },
    otherUser: {
      id: row.other_user_id,
      name: row.other_user_name,
      avatar: row.other_user_avatar,
      email: row.other_user_email,
      phone: row.other_user_phone,
      role: row.other_user_role,
    },
    latestMessage: row.last_message_id
      ? {
          id: row.last_message_id,
          conversationId: row.conversation_id,
          itemId: row.item_id,
          senderId: row.last_message_sender_id,
          receiverId: row.last_message_receiver_id,
          text: row.last_message_text,
          sentAt: row.last_message_sent_at,
          read: row.last_message_read,
        }
      : null,
    unreadCount: parseInt(row.unread_count, 10),
  }));
}

// Find existing conversation between two users for a specific item
async function findExistingConversation(clientOrPool, itemId, userA, userB) {
  const query = `
    SELECT *
    FROM conversations
    WHERE item_id = $1 AND (
      (participant_one_id = $2 AND participant_two_id = $3) OR
      (participant_one_id = $3 AND participant_two_id = $2)
    )
    LIMIT 1
  `;
  const result = await clientOrPool.query(query, [itemId, userA, userB]);
  return result.rows[0] || null;
}

// Create a new conversation
async function createConversation(clientOrPool, convData) {
  const query = `
    INSERT INTO conversations (id, item_id, participant_one_id, participant_two_id, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [
    convData.id,
    convData.itemId,
    convData.participantOneId,
    convData.participantTwoId,
    convData.createdAt || new Date().toISOString(),
  ];
  const result = await clientOrPool.query(query, values);
  return result.rows[0];
}

// Get single conversation by ID with item and participant data
async function getConversationById(clientOrPool, conversationId) {
  const query = `
    SELECT 
      c.*,
      i.title AS item_title,
      i.type AS item_type,
      i.status AS item_status,
      i.image AS item_image,
      i.reporter_id AS item_reporter_id,
      u1.name AS p1_name,
      u1.avatar AS p1_avatar,
      u2.name AS p2_name,
      u2.avatar AS p2_avatar
    FROM conversations c
    JOIN items i ON c.item_id = i.id
    JOIN users u1 ON c.participant_one_id = u1.id
    JOIN users u2 ON c.participant_two_id = u2.id
    WHERE c.id = $1
  `;
  const result = await clientOrPool.query(query, [conversationId]);
  return result.rows[0] || null;
}

// Get all messages in a conversation ordered chronologically
async function getMessagesByConversation(clientOrPool, conversationId) {
  const query = `
    SELECT 
      m.*,
      u1.name AS sender_name,
      u1.avatar AS sender_avatar,
      u2.name AS receiver_name,
      u2.avatar AS receiver_avatar
    FROM messages m
    JOIN users u1 ON m.sender_id = u1.id
    JOIN users u2 ON m.receiver_id = u2.id
    WHERE m.conversation_id = $1
    ORDER BY m.sent_at ASC
  `;
  const result = await clientOrPool.query(query, [conversationId]);
  return result.rows.map(formatMessage);
}

// Insert a new message
async function insertMessage(clientOrPool, msgData) {
  const query = `
    INSERT INTO messages (id, conversation_id, item_id, sender_id, receiver_id, text, sent_at, read)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [
    msgData.id,
    msgData.conversationId,
    msgData.itemId,
    msgData.senderId,
    msgData.receiverId,
    msgData.text,
    msgData.sentAt || new Date().toISOString(),
    msgData.read ?? false,
  ];
  const result = await clientOrPool.query(query, values);
  return result.rows[0];
}

// Mark messages as read for a specific recipient in a conversation
async function markMessagesAsRead(clientOrPool, conversationId, recipientId) {
  const query = `
    UPDATE messages
    SET read = TRUE
    WHERE conversation_id = $1 AND receiver_id = $2 AND read = FALSE
    RETURNING id
  `;
  const result = await clientOrPool.query(query, [conversationId, recipientId]);
  return result.rowCount;
}

module.exports = {
  formatMessage,
  getConversationsForUser,
  findExistingConversation,
  createConversation,
  getConversationById,
  getMessagesByConversation,
  insertMessage,
  markMessagesAsRead,
};
