const { query } = require("../db");

/**
 * Retrieve all users from the PostgreSQL users table.
 * Passwords are never selected.
 * @returns {Promise<Array<Object>>} List of safe users
 */
async function getAllUsers() {
  const sql = `
    SELECT
      id,
      name,
      email,
      phone,
      role,
      status,
      avatar
    FROM users
    ORDER BY role DESC, name ASC
  `;

  const result = await query(sql);
  return result.rows;
}

/**
 * Retrieve a single user by ID from the PostgreSQL users table.
 * Passwords are never selected.
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} Safe user or null if not found
 */
async function getUserById(id) {
  const sql = `
    SELECT
      id,
      name,
      email,
      phone,
      role,
      status,
      avatar
    FROM users
    WHERE id = $1
    LIMIT 1
  `;

  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

/**
 * Update a user's status field by ID.
 * @param {string} id - User ID
 * @param {string} status - New status value ('Active' | 'Suspended')
 * @returns {Promise<Object|null>} Updated safe user or null if not found
 */
async function updateUserStatus(id, status) {
  const sql = `
    UPDATE users
    SET status = $2
    WHERE id = $1
    RETURNING
      id,
      name,
      email,
      phone,
      role,
      status,
      avatar
  `;

  const result = await query(sql, [id, status]);
  return result.rows[0] || null;
}

/**
 * Update a user's profile information.
 * Password, role and status are never changed here.
 * @param {string} id - User ID
 * @param {Object} profile - Editable profile fields
 * @returns {Promise<Object|null>} Updated safe user or null if not found
 */
async function updateUserProfile(id, profile) {
  const sql = `
    UPDATE users
    SET
      name = $2,
      phone = $3,
      avatar = $4
    WHERE id = $1
    RETURNING
      id,
      name,
      email,
      phone,
      role,
      status,
      avatar
  `;

  const result = await query(sql, [
    id,
    profile.name,
    profile.phone,
    profile.avatar || "",
  ]);

  return result.rows[0] || null;
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateUserStatus,
};