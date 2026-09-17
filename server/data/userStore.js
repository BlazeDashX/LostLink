const db = require("../db");

/**
 * Find user by email directly in PostgreSQL users table.
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
async function findUserByEmail(email) {
  if (!email) return null;

  const result = await db.query(
    `
      SELECT
        id,
        name,
        email,
        password_hash AS password,
        phone,
        role,
        status,
        avatar
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email.trim()]
  );

  return result.rows[0] || null;
}

/**
 * Insert a new user strictly into PostgreSQL users table.
 * @param {Object} user
 * @returns {Promise<Object>}
 */
async function createUser(user) {
  const result = await db.query(
    `
      INSERT INTO users (
        id,
        name,
        email,
        password_hash,
        phone,
        role,
        status,
        avatar
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        name,
        email,
        password_hash AS password,
        phone,
        role,
        status,
        avatar
    `,
    [
      user.id,
      user.name,
      user.email.toLowerCase().trim(),
      user.password,
      user.phone,
      user.role,
      user.status,
      user.avatar || "",
    ]
  );

  return result.rows[0];
}

module.exports = { findUserByEmail, createUser };