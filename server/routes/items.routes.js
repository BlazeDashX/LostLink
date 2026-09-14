const express = require("express");
const router = express.Router();
const itemsController = require("../controllers/items.controller");
const { requireAuth } = require("../middleware/auth");

router.post("/", requireAuth, itemsController.createItem);

module.exports = router;
