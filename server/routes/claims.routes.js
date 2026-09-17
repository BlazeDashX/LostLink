const express = require("express");
const router = express.Router();
const claimsController = require("../controllers/claims.controller");
const { requireAuth } = require("../middleware/auth");

// POST /api/claims - Submit a new claim (requires authentication)
router.post("/", requireAuth, claimsController.createClaim);

// GET /api/claims - List claims with filters
router.get("/", requireAuth, claimsController.getClaims);

// GET /api/claims/:id - Get a single claim by ID
router.get("/:id", requireAuth, claimsController.getClaimById);

// PATCH /api/claims/:id - Approve, Reject, or Complete a claim (requires authentication)
router.patch("/:id", requireAuth, claimsController.updateClaimDecision);

module.exports = router;
