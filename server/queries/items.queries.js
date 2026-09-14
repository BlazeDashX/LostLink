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

/**
 * Retrieve an item by ID from the items table.
 * @param {string} id
 * @returns {Promise<Object|null>} Item formatted with camelCase properties or null
 */
async function getItemById(id) {
  const sql = `
    SELECT id, type, title, category_id AS "categoryId", description, location,
           TO_CHAR(report_date, 'YYYY-MM-DD') AS "reportDate",
           image, reporter_id AS "reporterId", status,
           created_at AS "createdAt"
    FROM items
    WHERE id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

/**
 * Update an item in the items table.
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>} Updated item formatted with camelCase properties
 */
async function updateItem(id, {
  type,
  title,
  categoryId,
  description,
  location,
  reportDate,
  image,
}) {
  const sql = `
    UPDATE items
    SET type = COALESCE($2, type),
        title = COALESCE($3, title),
        category_id = COALESCE($4, category_id),
        description = COALESCE($5, description),
        location = COALESCE($6, location),
        report_date = COALESCE($7, report_date),
        image = COALESCE($8, image)
    WHERE id = $1
    RETURNING id, type, title, category_id AS "categoryId", description, location,
              TO_CHAR(report_date, 'YYYY-MM-DD') AS "reportDate",
              image, reporter_id AS "reporterId", status,
              created_at AS "createdAt"
  `;
  const values = [
    id,
    type !== undefined ? type : null,
    title !== undefined ? title : null,
    categoryId !== undefined ? categoryId : null,
    description !== undefined ? description : null,
    location !== undefined ? location : null,
    reportDate !== undefined ? reportDate : null,
    image !== undefined ? image : null,
  ];
  const result = await query(sql, values);
  return result.rows[0];
}

module.exports = {
  createItem,
  getItemById,
  updateItem,
};
