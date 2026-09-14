const { query } = require("../db");

/**
 * Authentication middleware to verify user identity.
 * Checks x-user-id header, Authorization Bearer token, or body.reporterId.
 * Validates against Neon PostgreSQL users table and checks for Suspended status.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const headerUserId = req.headers["x-user-id"];
    const bodyUserId = req.body?.reporterId;

    let userId = null;
    if (headerUserId) {
      userId = headerUserId;
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      userId = authHeader.split(" ")[1];
    } else if (bodyUserId) {
      userId = bodyUserId;
    }

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    const result = await query(
      "SELECT id, name, email, role, status FROM users WHERE id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        message: "Invalid session or user not found.",
      });
    }

    const user = result.rows[0];

    if (user.status === "Suspended") {
      return res.status(403).json({
        message: "Your account has been suspended.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      message: "Internal authentication error.",
    });
  }
}

module.exports = {
  requireAuth,
};
