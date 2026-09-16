const usersQueries = require("../queries/users.queries");

/**
 * Controller to handle GET /api/users
 * Returns all users (without passwords) — admin only.
 */
async function getUsers(req, res) {
  try {
    // Backend authorization: only Admin role may list users
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Forbidden. Admin role required.",
      });
    }

    const users = await usersQueries.getAllUsers();
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
}

/**
 * Controller to handle PATCH /api/users/:id
 * Toggles a user's status between Active and Suspended — admin only.
 * Guards:
 *   - Only Admin role may call this endpoint.
 *   - An admin cannot suspend their own account.
 *   - Only 'Active' and 'Suspended' are accepted status values.
 */
async function updateUserStatus(req, res) {
  try {
    // 1. Backend authorization: only Admin role
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Forbidden. Admin role required.",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // 2. Validate status value — only the existing project statuses
    if (!status || !["Active", "Suspended"].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'Active' or 'Suspended'.",
      });
    }

    // 3. Prevent admin from suspending their own active session
    if (id === req.user.id) {
      return res.status(400).json({
        message: "You cannot change the status of your own account.",
      });
    }

    // 4. Apply update
    const updatedUser = await usersQueries.updateUserStatus(id, status);

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: `User ${updatedUser.name} is now ${updatedUser.status}.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return res.status(500).json({
      message: "Failed to update user status.",
      error: error.message,
    });
  }
}

module.exports = {
  getUsers,
  updateUserStatus,
};
