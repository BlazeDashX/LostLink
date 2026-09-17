const { query } = require("../db");

/**
 * Controller to handle GET /api/admin/stats
 * Returns dashboard aggregate metrics for the admin dashboard.
 * Requires the authenticated user to have role === 'Admin'.
 *
 * All metrics are calculated strictly from the live PostgreSQL/Neon database:
 *   - Users:  users table
 *   - Items:  items table
 *   - Claims: claims table
 */
async function getAdminStats(req, res) {
  try {
    // 1. Authorization — backend enforces Admin role
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Forbidden. Admin role required.",
      });
    }

    // 2. Users count — live from PostgreSQL users table
    const usersResult = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Active') AS active,
        COUNT(*) FILTER (WHERE status = 'Suspended') AS suspended
      FROM users
    `);
    const usersRow = usersResult.rows[0] || { total: 0, active: 0, suspended: 0 };

    // 3. Items stats — live from PostgreSQL items table
    const itemsResult = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Active') AS active,
        COUNT(*) FILTER (WHERE status = 'Solved') AS solved,
        COUNT(*) FILTER (WHERE status = 'Pending Claim') AS pending_claim,
        COUNT(*) FILTER (WHERE status = 'Hidden') AS hidden
      FROM items
    `);
    const itemsRow = itemsResult.rows[0] || { total: 0, active: 0, solved: 0, pending_claim: 0, hidden: 0 };

    // 4. Claims stats — live from PostgreSQL claims table
    const claimsResult = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'Approved') AS approved,
        COUNT(*) FILTER (WHERE status = 'Completed') AS completed
      FROM claims
    `);
    const claimsRow = claimsResult.rows[0] || { total: 0, pending: 0, approved: 0, completed: 0 };

    return res.status(200).json({
      users: {
        total: parseInt(usersRow.total || 0, 10),
        active: parseInt(usersRow.active || 0, 10),
        suspended: parseInt(usersRow.suspended || 0, 10),
      },
      items: {
        total: parseInt(itemsRow.total || 0, 10),
        active: parseInt(itemsRow.active || 0, 10),
        solved: parseInt(itemsRow.solved || 0, 10),
        pendingClaim: parseInt(itemsRow.pending_claim || 0, 10),
        hidden: parseInt(itemsRow.hidden || 0, 10),
      },
      claims: {
        total: parseInt(claimsRow.total || 0, 10),
        pending: parseInt(claimsRow.pending || 0, 10),
        approved: parseInt(claimsRow.approved || 0, 10),
        completed: parseInt(claimsRow.completed || 0, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats from PostgreSQL:", error);
    return res.status(500).json({
      message: "Failed to fetch dashboard metrics from database.",
      error: error.message,
    });
  }
}

module.exports = {
  getAdminStats,
};
