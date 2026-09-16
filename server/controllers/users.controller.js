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

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    return res.status(500).json({
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
}

/**
 * Controller to handle GET /api/users/:id
 * Returns a single user without password — authenticated users.
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const user = await usersQueries.getUserById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);

    return res.status(500).json({
      message: "Failed to fetch user.",
    });
  }
}

/**
 * Controller to handle PATCH /api/users/:id
 *
 * Supports two types of updates:
 *
 * 1. Admin status update:
 *    { status: "Active" | "Suspended" }
 *
 * 2. User profile update:
 *    { name, phone, avatar }
 */
async function updateUser(req, res) {
  try {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { id } = req.params;
    const { status, name, phone, avatar } = req.body;

    // --------------------------------------------------
    // ADMIN STATUS UPDATE
    // --------------------------------------------------

    if (status !== undefined) {
      // Only Admin can change user status
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message: "Forbidden. Admin role required.",
        });
      }

      // Validate status
      if (!["Active", "Suspended"].includes(status)) {
        return res.status(400).json({
          message: "Status must be 'Active' or 'Suspended'.",
        });
      }

      // Admin cannot change their own status
      if (id === req.user.id) {
        return res.status(400).json({
          message: "You cannot change the status of your own account.",
        });
      }

      // Update status in database
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
    }

    // --------------------------------------------------
    // PROFILE UPDATE
    // --------------------------------------------------

    // Users can update only their own profile
    if (req.user.id !== id) {
      return res.status(403).json({
        message: "You can only update your own profile.",
      });
    }

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required.",
      });
    }

    // Validate phone
    if (!phone || !phone.trim()) {
      return res.status(400).json({
        message: "Phone number is required.",
      });
    }

    // Update profile in database
    const updatedUser = await usersQueries.updateUserProfile(id, {
      name: name.trim(),
      phone: phone.trim(),
      avatar: avatar || "",
    });

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    return res.status(500).json({
      message: "Failed to update user.",
    });
  }
}

module.exports = {
  getUsers,
  getUserById,
  updateUser,
};