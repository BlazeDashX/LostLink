const express = require("express");
const router = express.Router();
const itemsController = require("../controllers/items.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");

router.post("/", requireAuth, itemsController.createItem);
router.get("/", optionalAuth, itemsController.getItems);
router.get("/:id", optionalAuth, itemsController.getItem);
router.patch("/:id", requireAuth, itemsController.updateItem);
router.delete("/:id", requireAuth, itemsController.deleteItem);

module.exports = router;
