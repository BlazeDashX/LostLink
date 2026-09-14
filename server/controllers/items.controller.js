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

module.exports = {
  createItem,
};
