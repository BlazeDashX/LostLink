const express = require("express");
const router = express.Router();
const itemsController = require("../controllers/items.controller");
const { requireAuth } = require("../middleware/auth");

router.post("/", requireAuth, itemsController.createItem);
router.get("/:id", itemsController.getItem);
router.patch("/:id", requireAuth, itemsController.updateItem);

module.exports = router;
