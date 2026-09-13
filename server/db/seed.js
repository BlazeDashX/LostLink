const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("./index");

const usersData = require("../../data/users.json");
const categoriesData = require("../../data/categories.json");
const itemsData = require("../../data/items.json");
const claimsData = require("../../data/claims.json");
const messagesData = require("../../data/message.json");
const notificationsData = require("../../data/notifications.json");

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log("Starting database initialization and seeding...");

    // 1. Execute schema.sql
    console.log("Applying schema.sql...");
    const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
    await client.query(schemaSql);
    console.log("Schema applied successfully.");

    // 2. Seed Users with bcrypt hashed passwords
    console.log("Seeding users...");
    for (const user of usersData) {
      let passwordHash = user.password;
      if (!passwordHash.startsWith("$2")) {
        passwordHash = await bcrypt.hash(user.password || "password123", 10);
      }
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, phone, role, status, avatar)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          user.name,
          user.email.toLowerCase().trim(),
          passwordHash,
          user.phone,
          user.role,
          user.status,
          user.avatar || null,
        ]
      );
    }
    console.log(`Seeded ${usersData.length} users.`);

    // 3. Seed Categories
    console.log("Seeding categories...");
    for (const category of categoriesData) {
      await client.query(
        `INSERT INTO categories (id, name, icon, active)
         VALUES ($1, $2, $3, $4)`,
        [category.id, category.name, category.icon || null, category.active ?? true]
      );
    }
    console.log(`Seeded ${categoriesData.length} categories.`);

    // 4. Seed Items
    console.log("Seeding items...");
    for (const item of itemsData) {
      await client.query(
        `INSERT INTO items (id, type, title, category_id, description, location, report_date, image, reporter_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          item.id,
          item.type,
          item.title,
          item.categoryId,
          item.description,
          item.location,
          item.reportDate,
          item.image || null,
          item.reporterId,
          item.status,
          item.createdAt || new Date().toISOString(),
        ]
      );
    }
    console.log(`Seeded ${itemsData.length} items.`);

    // 5. Seed Claims
    console.log("Seeding claims...");
    for (const claim of claimsData) {
      const answers = claim.answers || {};
      await client.query(
        `INSERT INTO claims (id, item_id, claimant_id, identifying_detail, loss_context, private_evidence, handover_method, status, reviewed_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          claim.id,
          claim.itemId,
          claim.claimantId,
          answers.identifyingDetail || "",
          answers.lossContext || "",
          answers.privateEvidence || "",
          claim.handoverMethod,
          claim.status,
          claim.reviewedBy || null,
          claim.createdAt || new Date().toISOString(),
        ]
      );
    }
    console.log(`Seeded ${claimsData.length} claims.`);

    // 6. Derive and Seed Conversations & Messages
    console.log("Deriving and seeding conversations...");
    const conversationsMap = new Map();

    for (const msg of messagesData) {
      if (!conversationsMap.has(msg.conversationId)) {
        conversationsMap.set(msg.conversationId, {
          id: msg.conversationId,
          itemId: msg.itemId,
          participantOneId: msg.senderId,
          participantTwoId: msg.receiverId,
          createdAt: msg.sentAt,
        });
      }
    }

    for (const conv of conversationsMap.values()) {
      await client.query(
        `INSERT INTO conversations (id, item_id, participant_one_id, participant_two_id, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [conv.id, conv.itemId, conv.participantOneId, conv.participantTwoId, conv.createdAt]
      );
    }
    console.log(`Seeded ${conversationsMap.size} conversations.`);

    console.log("Seeding messages...");
    for (const msg of messagesData) {
      await client.query(
        `INSERT INTO messages (id, conversation_id, item_id, sender_id, receiver_id, text, sent_at, read)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          msg.id,
          msg.conversationId,
          msg.itemId,
          msg.senderId,
          msg.receiverId,
          msg.text,
          msg.sentAt || new Date().toISOString(),
          msg.read ?? false,
        ]
      );
    }
    console.log(`Seeded ${messagesData.length} messages.`);

    // 7. Seed Notifications
    console.log("Seeding notifications...");
    for (const notif of notificationsData) {
      await client.query(
        `INSERT INTO notifications (id, user_id, type, title, message, related_id, read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          notif.id,
          notif.userId,
          notif.type,
          notif.title,
          notif.message,
          notif.relatedId || null,
          notif.read ?? false,
          notif.createdAt || new Date().toISOString(),
        ]
      );
    }
    console.log(`Seeded ${notificationsData.length} notifications.`);

    console.log("✅ All 7 tables populated successfully!");
  } catch (err) {
    console.error("❌ Database seeding failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
