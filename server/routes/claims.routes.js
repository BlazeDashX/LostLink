const express = require("express");
const router = express.Router();
const claimsController = require("../controllers/claims.controller");

// POST /api/claims - Submit a new claim
router.post("/", claimsController.createClaim);

// GET /api/claims - List claims with filters
router.get("/", claimsController.getClaims);

// GET /api/claims/:id - Get a single claim by ID
router.get("/:id", claimsController.getClaimById);

// PATCH /api/claims/:id - Approve, Reject, or Complete a claim
router.patch("/:id", claimsController.updateClaimDecision);

module.exports = router;
