const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const { requireAuth } = require("../middleware/auth");

// GET /api/users — list all users (admin only)
router.get("/", requireAuth, usersController.getUsers);

// PATCH /api/users/:id — update user status (admin only)
router.patch("/:id", requireAuth, usersController.updateUserStatus);

// DELETE /api/users/:id — delete user (admin only)
router.delete("/:id", requireAuth, usersController.deleteUser);

module.exports = router;
