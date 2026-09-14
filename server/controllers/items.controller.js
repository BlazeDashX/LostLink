const itemsQueries = require("../queries/items.queries");
const { query } = require("../db");

/**
 * Controller to handle POST /api/items
 * Validates request, checks category existence, and persists item with authenticated reporter.
 */
async function createItem(req, res) {
  try {
    const {
      type,
      title,
      categoryId,
      category_id,
      description,
      location,
      reportDate,
      report_date,
      image,
    } = req.body;

    const selectedCategoryId = categoryId || category_id;
    const selectedReportDate = reportDate || report_date;

    // 1. Report Type validation
    if (!type || !["Lost", "Found"].includes(type)) {
      return res.status(400).json({
        message: "Valid report type ('Lost' or 'Found') is required.",
      });
    }

    // 2. Title validation
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({
        message: "Title must be at least 3 characters.",
      });
    }

    if (title.trim().length > 150) {
      return res.status(400).json({
        message: "Title cannot exceed 150 characters.",
      });
    }

    // 3. Category validation
    if (!selectedCategoryId) {
      return res.status(400).json({
        message: "Category is required.",
      });
    }

    const catCheck = await query(
      "SELECT id, active FROM categories WHERE id = $1",
      [selectedCategoryId]
    );

    if (catCheck.rowCount === 0) {
      return res.status(400).json({
        message: "Invalid category selected.",
      });
    }

    // 4. Description validation
    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length < 10
    ) {
      return res.status(400).json({
        message: "Description must be at least 10 characters.",
      });
    }

    // 5. Location validation
    if (!location || typeof location !== "string" || !location.trim()) {
      return res.status(400).json({
        message: "Location is required.",
      });
    }

    if (location.trim().length > 255) {
      return res.status(400).json({
        message: "Location cannot exceed 255 characters.",
      });
    }

    // 6. Report Date validation
    if (!selectedReportDate) {
      return res.status(400).json({
        message: "Report date is required.",
      });
    }

    const parsedDate = new Date(selectedReportDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid report date format.",
      });
    }

    // 7. Verified authenticated reporter
    const reporterId = req.user.id;

    // 8. Generate item ID: I + timestamp (14 chars, fits in VARCHAR(16))
    const id = `I${Date.now()}`;

    const newItem = await itemsQueries.createItem({
      id,
      type,
      title: title.trim(),
      categoryId: selectedCategoryId,
      description: description.trim(),
      location: location.trim(),
      reportDate: selectedReportDate,
      image: image || "placeholder.png",
      reporterId,
      status: "Active",
    });

    return res.status(201).json({
      message: "Item reported successfully.",
      item: newItem,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    return res.status(500).json({
      message: "Failed to create item report.",
      error: error.message,
    });
  }
}

/**
 * Controller to handle GET /api/items/:id
 * Fetches single item by ID.
 */
async function getItem(req, res) {
  try {
    const { id } = req.params;
    const item = await itemsQueries.getItemById(id);

    if (!item) {
      return res.status(404).json({
        message: "Item not found.",
      });
    }

    return res.status(200).json({
      item,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return res.status(500).json({
      message: "Failed to fetch item.",
      error: error.message,
    });
  }
}

/**
 * Controller to handle PATCH /api/items/:id
 * Authorizes user (must be original reporter or Admin),
 * validates input data, and updates the item.
 */
async function updateItem(req, res) {
  try {
    const { id } = req.params;

    // 1. Verify item exists
    const existingItem = await itemsQueries.getItemById(id);
    if (!existingItem) {
      return res.status(404).json({
        message: "Item not found.",
      });
    }

    // 2. Authorization check: verified authenticated user must own report or be Admin
    const isOwner = req.user.id === existingItem.reporterId;
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to edit this report.",
      });
    }

    const {
      type,
      title,
      categoryId,
      category_id,
      description,
      location,
      reportDate,
      report_date,
      image,
    } = req.body;

    const selectedCategoryId = categoryId !== undefined ? categoryId : category_id;
    const selectedReportDate = reportDate !== undefined ? reportDate : report_date;

    // 3. Validation
    // Report Type validation
    if (type !== undefined) {
      if (!type || !["Lost", "Found"].includes(type)) {
        return res.status(400).json({
          message: "Valid report type ('Lost' or 'Found') is required.",
        });
      }
    }

    // Title validation
    if (title !== undefined) {
      if (!title || typeof title !== "string" || title.trim().length < 3) {
        return res.status(400).json({
          message: "Title must be at least 3 characters.",
        });
      }
      if (title.trim().length > 150) {
        return res.status(400).json({
          message: "Title cannot exceed 150 characters.",
        });
      }
    }

    // Category validation
    if (selectedCategoryId !== undefined) {
      if (!selectedCategoryId) {
        return res.status(400).json({
          message: "Category is required.",
        });
      }
      const catCheck = await query(
        "SELECT id, active FROM categories WHERE id = $1",
        [selectedCategoryId]
      );
      if (catCheck.rowCount === 0) {
        return res.status(400).json({
          message: "Invalid category selected.",
        });
      }
    }

    // Description validation
    if (description !== undefined) {
      if (
        !description ||
        typeof description !== "string" ||
        description.trim().length < 10
      ) {
        return res.status(400).json({
          message: "Description must be at least 10 characters.",
        });
      }
    }

    // Location validation
    if (location !== undefined) {
      if (!location || typeof location !== "string" || !location.trim()) {
        return res.status(400).json({
          message: "Location is required.",
        });
      }
      if (location.trim().length > 255) {
        return res.status(400).json({
          message: "Location cannot exceed 255 characters.",
        });
      }
    }

    // Report Date validation
    if (selectedReportDate !== undefined) {
      if (!selectedReportDate) {
        return res.status(400).json({
          message: "Report date is required.",
        });
      }
      const parsedDate = new Date(selectedReportDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid report date format.",
        });
      }
    }

    // 4. Update the item (reporter_id is strictly preserved and cannot be changed)
    const updatedItem = await itemsQueries.updateItem(id, {
      type: type !== undefined ? type : existingItem.type,
      title: title !== undefined ? title.trim() : existingItem.title,
      categoryId: selectedCategoryId !== undefined ? selectedCategoryId : existingItem.categoryId,
      description: description !== undefined ? description.trim() : existingItem.description,
      location: location !== undefined ? location.trim() : existingItem.location,
      reportDate: selectedReportDate !== undefined ? selectedReportDate : existingItem.reportDate,
      image: image !== undefined ? image : existingItem.image,
    });

    return res.status(200).json({
      message: "Item updated successfully.",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    return res.status(500).json({
      message: "Failed to update item report.",
      error: error.message,
    });
  }
}

/**
 * Controller to handle DELETE /api/items/:id
 * Verifies that the user owns the report (or is Admin),
 * and permanently deletes the item and cascades dependent records.
 */
async function deleteItem(req, res) {
  try {
    const { id } = req.params;

    // 1. Verify item exists
    const existingItem = await itemsQueries.getItemById(id);
    if (!existingItem) {
      return res.status(404).json({
        message: "Item not found or already deleted.",
      });
    }

    // 2. Authorization: Authenticated user must own report or have Admin role
    const isOwner = req.user.id === existingItem.reporterId;
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to delete this report.",
      });
    }

    // 3. Delete from database
    await itemsQueries.deleteItem(id);

    return res.status(200).json({
      message: "Item report deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({
      message: "Failed to delete item report.",
      error: error.message,
    });
  }
}

module.exports = {
  createItem,
  getItem,
  updateItem,
  deleteItem,
};
