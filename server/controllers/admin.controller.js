const { query } = require("../db");
const usersData = require("../../data/users.json");
const claimsData = require("../../data/claims.json");

/**
 * Controller to handle GET /api/admin/stats
 * Returns dashboard aggregate metrics for the admin dashboard.
 * Requires the authenticated user to have role === 'Admin'.
 *
 * Data sources:
 *   - Users:  data/users.json (project's user store — no PostgreSQL users table)
 *   - Items:  Neon PostgreSQL items table (live backend data)
 *   - Claims: data/claims.json (project's claims store — no backend claims API)
 */
async function getAdminStats(req, res) {
  try {
    // 1. Authorization — backend enforces Admin role regardless of frontend routing
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Forbidden. Admin role required.",
      });
    }

    // 2. Users count — from data/users.json (the project's actual user store)
    const totalUsers = usersData.length;
    const activeUsers = usersData.filter((u) => u.status === "Active").length;
    const suspendedUsers = usersData.filter((u) => u.status === "Suspended").length;

    // 3. Items stats — from PostgreSQL (live data)
    const itemsResult = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Active') AS active,
        COUNT(*) FILTER (WHERE status = 'Solved') AS solved,
        COUNT(*) FILTER (WHERE status = 'Pending Claim') AS pending_claim,
        COUNT(*) FILTER (WHERE status = 'Hidden') AS hidden
      FROM items
    `);
    const itemsRow = itemsResult.rows[0];

    // 4. Claims stats — from data/claims.json (the project's actual claims store)
    const totalClaims = claimsData.length;
    const pendingClaims = claimsData.filter((c) => c.status === "Pending").length;
    const approvedClaims = claimsData.filter((c) => c.status === "Approved").length;
    const completedClaims = claimsData.filter((c) => c.status === "Completed").length;

    return res.status(200).json({
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
      },
      items: {
        total: parseInt(itemsRow.total, 10),
        active: parseInt(itemsRow.active, 10),
        solved: parseInt(itemsRow.solved, 10),
        pendingClaim: parseInt(itemsRow.pending_claim, 10),
        hidden: parseInt(itemsRow.hidden, 10),
      },
      claims: {
        total: totalClaims,
        pending: pendingClaims,
        approved: approvedClaims,
        completed: completedClaims,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return res.status(500).json({
      message: "Failed to fetch dashboard metrics.",
      error: error.message,
    });
  }
}

module.exports = {
  getAdminStats,
};
