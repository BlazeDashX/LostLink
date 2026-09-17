const { query } = require("../db");

/**
 * Find user by email directly in PostgreSQL users table.
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
async function findUserByEmail(email) {
  const normalizedEmail = (email || "").trim().toLowerCase();

  const sql = `
    SELECT id, name, email, password_hash AS password, phone, role, status, avatar
    FROM users
    WHERE LOWER(email) = LOWER($1)
  `;
  const result = await query(sql, [normalizedEmail]);
  if (result && result.rows && result.rows.length > 0) {
    return result.rows[0];
  }
  return null;
}

/**
 * Insert a new user strictly into PostgreSQL users table.
 * @param {Object} user
 * @returns {Promise<Object>}
 */
async function createUser(user) {
  const sql = `
    INSERT INTO users (id, name, email, password_hash, phone, role, status, avatar)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, name, email, phone, role, status, avatar
  `;
  const result = await query(sql, [
    user.id,
    user.name,
    user.email,
    user.password, // bcrypt hashed password
    user.phone,
    user.role || "User",
    user.status || "Active",
    user.avatar || "",
  ]);
  return result.rows[0];
}

module.exports = {
  findUserByEmail,
  createUser,
};