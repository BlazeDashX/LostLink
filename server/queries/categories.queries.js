const { query } = require("../db");

/**
 * Fetch all categories ordered by ID.
 * @returns {Promise<Array>} Array of category objects
 */
async function getAllCategories() {
  const result = await query(
    "SELECT id, name, icon, active FROM categories ORDER BY id ASC"
  );
  return result.rows;
}

/**
 * Fetch all active categories ordered by ID.
 * @returns {Promise<Array>} Array of active category objects
 */
async function getActiveCategories() {
  const result = await query(
    "SELECT id, name, icon, active FROM categories WHERE active = true ORDER BY id ASC"
  );
  return result.rows;
}

module.exports = {
  getAllCategories,
  getActiveCategories,
};
