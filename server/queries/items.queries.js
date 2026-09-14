const { query } = require("../db");

/**
 * Insert a new item into the items table.
 * @param {Object} item
 * @returns {Promise<Object>} Inserted item row formatted with camelCase properties
 */
async function createItem({
  id,
  type,
  title,
  categoryId,
  description,
  location,
  reportDate,
  image,
  reporterId,
  status = "Active",
}) {
  const sql = `
    INSERT INTO items (id, type, title, category_id, description, location, report_date, image, reporter_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, type, title, category_id AS "categoryId", description, location, 
              TO_CHAR(report_date, 'YYYY-MM-DD') AS "reportDate", 
              image, reporter_id AS "reporterId", status, 
              created_at AS "createdAt"
  `;
  const values = [
    id,
    type,
    title,
    categoryId,
    description,
    location,
    reportDate,
    image || "placeholder.png",
    reporterId,
    status,
  ];
  const result = await query(sql, values);
  return result.rows[0];
}

module.exports = {
  createItem,
};
