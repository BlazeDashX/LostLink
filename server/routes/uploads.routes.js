const express = require("express");
const router = express.Router();
const uploadsController = require("../controllers/uploads.controller");
const { requireAuth } = require("../middleware/auth");

router.post("/", requireAuth, uploadsController.uploadImage);

module.exports = router;
