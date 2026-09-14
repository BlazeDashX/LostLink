const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { requireAuth } = require("../middleware/auth");

// GET /api/admin/stats — admin-only dashboard metrics
router.get("/stats", requireAuth, adminController.getAdminStats);

module.exports = router;
