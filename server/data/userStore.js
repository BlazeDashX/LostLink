const { pool } = require("../db");
const usersJson = require("../../data/users.json");

async function findUserByEmail(email) {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash AS password, phone, role, status, avatar FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (err) {
    console.error("Database query error in findUserByEmail, checking fallback:", err.message);
  }

  return usersJson.find(
    (user) => user.email.toLowerCase().trim() === normalizedEmail
  );
}

async function createUser(user) {
  try {
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, phone, role, status, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        user.id,
        user.name,
        user.email.toLowerCase().trim(),
        user.password,
        user.phone,
        user.role,
        user.status,
        user.avatar || null,
      ]
    );
  } catch (err) {
    console.error("Database insert error in createUser:", err.message);
  }
  usersJson.push(user);
  return user;
}

module.exports = {
  findUserByEmail,
  createUser,
};