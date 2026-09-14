const { pool } = require("../db");

// Map a raw SQL claim row to standard API format
function formatClaim(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemId: row.item_id,
    claimantId: row.claimant_id,
    claimantName: row.claimant_name,
    claimantAvatar: row.claimant_avatar,
    itemTitle: row.item_title,
    itemType: row.item_type,
    itemStatus: row.item_status,
    reporterId: row.reporter_id,
    answers: {
      identifyingDetail: row.identifying_detail,
      lossContext: row.loss_context,
      privateEvidence: row.private_evidence,
    },
    handoverMethod: row.handover_method,
    status: row.status,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
  };
}

async function getItemById(clientOrPool, itemId) {
  const query = `
    SELECT id, type, title, reporter_id, status, location
    FROM items
    WHERE id = $1
  `;
  const result = await clientOrPool.query(query, [itemId]);
  return result.rows[0] || null;
}

async function findActiveClaimByClaimant(clientOrPool, itemId, claimantId) {
  const query = `
    SELECT id, status
    FROM claims
    WHERE item_id = $1 AND claimant_id = $2 AND status IN ('Pending', 'Approved')
    LIMIT 1
  `;
  const result = await clientOrPool.query(query, [itemId, claimantId]);
  return result.rows[0] || null;
}

async function insertClaim(client, claimData) {
  const query = `
    INSERT INTO claims (
      id, item_id, claimant_id, identifying_detail,
      loss_context, private_evidence, handover_method,
      status, reviewed_by, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const values = [
    claimData.id,
    claimData.itemId,
    claimData.claimantId,
    claimData.identifyingDetail,
    claimData.lossContext,
    claimData.privateEvidence,
    claimData.handoverMethod,
    claimData.status || "Pending",
    claimData.reviewedBy || null,
    claimData.createdAt || new Date().toISOString(),
  ];
  const result = await client.query(query, values);
  return result.rows[0];
}

async function getClaimById(clientOrPool, claimId) {
  const query = `
    SELECT 
      c.*,
      u.name AS claimant_name,
      u.avatar AS claimant_avatar,
      i.title AS item_title,
      i.type AS item_type,
      i.status AS item_status,
      i.reporter_id
    FROM claims c
    JOIN users u ON c.claimant_id = u.id
    JOIN items i ON c.item_id = i.id
    WHERE c.id = $1
  `;
  const result = await clientOrPool.query(query, [claimId]);
  return formatClaim(result.rows[0]);
}

async function getClaims(clientOrPool, filters = {}) {
  let query = `
    SELECT 
      c.*,
      u.name AS claimant_name,
      u.avatar AS claimant_avatar,
      i.title AS item_title,
      i.type AS item_type,
      i.status AS item_status,
      i.reporter_id
    FROM claims c
    JOIN users u ON c.claimant_id = u.id
    JOIN items i ON c.item_id = i.id
    WHERE 1=1
  `;
  const values = [];
  let paramIdx = 1;

  if (filters.itemId) {
    query += ` AND c.item_id = $${paramIdx++}`;
    values.push(filters.itemId);
  }
  if (filters.claimantId) {
    query += ` AND c.claimant_id = $${paramIdx++}`;
    values.push(filters.claimantId);
  }
  if (filters.reporterId) {
    query += ` AND i.reporter_id = $${paramIdx++}`;
    values.push(filters.reporterId);
  }
  if (filters.status) {
    query += ` AND c.status = $${paramIdx++}`;
    values.push(filters.status);
  }

  query += ` ORDER BY c.created_at DESC`;

  const result = await clientOrPool.query(query, values);
  return result.rows.map(formatClaim);
}

async function updateClaimStatus(client, claimId, status, reviewedBy) {
  const query = `
    UPDATE claims
    SET status = $1, reviewed_by = $2
    WHERE id = $3
    RETURNING *
  `;
  const result = await client.query(query, [status, reviewedBy, claimId]);
  return result.rows[0];
}

async function rejectCompetingClaims(client, itemId, approvedClaimId, reviewedBy) {
  const query = `
    UPDATE claims
    SET status = 'Rejected', reviewed_by = $1
    WHERE item_id = $2 AND id != $3 AND status = 'Pending'
    RETURNING *
  `;
  const result = await client.query(query, [reviewedBy, itemId, approvedClaimId]);
  return result.rows;
}

async function countActiveClaimsForItem(client, itemId) {
  const query = `
    SELECT COUNT(*) AS count
    FROM claims
    WHERE item_id = $1 AND status IN ('Pending', 'Approved')
  `;
  const result = await client.query(query, [itemId]);
  return parseInt(result.rows[0].count, 10);
}

async function updateItemStatus(client, itemId, status) {
  const query = `
    UPDATE items
    SET status = $1
    WHERE id = $2
    RETURNING *
  `;
  const result = await client.query(query, [status, itemId]);
  return result.rows[0];
}

async function insertNotification(client, notif) {
  const query = `
    INSERT INTO notifications (id, user_id, type, title, message, related_id, read, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [
    notif.id || `N${Date.now()}`,
    notif.userId,
    notif.type,
    notif.title,
    notif.message,
    notif.relatedId || null,
    notif.read ?? false,
    notif.createdAt || new Date().toISOString(),
  ];
  const result = await client.query(query, values);
  return result.rows[0];
}

module.exports = {
  formatClaim,
  getItemById,
  findActiveClaimByClaimant,
  insertClaim,
  getClaimById,
  getClaims,
  updateClaimStatus,
  rejectCompetingClaims,
  countActiveClaimsForItem,
  updateItemStatus,
  insertNotification,
};
