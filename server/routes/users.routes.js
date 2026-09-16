const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const { requireAuth } = require("../middleware/auth");

// GET /api/users — list all users (admin only)
router.get("/", requireAuth, usersController.getUsers);

// PATCH /api/users/:id — update user status (admin only)
router.patch("/:id", requireAuth, usersController.updateUserStatus);

module.exports = router;
