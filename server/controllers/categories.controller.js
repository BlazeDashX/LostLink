const categoriesQueries = require("../queries/categories.queries");

/**
 * Controller to handle GET /api/categories
 * Supports optional ?active=true query parameter
 */
async function getCategories(req, res) {
  try {
    const { active } = req.query;
    let categories;

    if (active === "true") {
      categories = await categoriesQueries.getActiveCategories();
    } else {
      categories = await categoriesQueries.getAllCategories();
    }

    return res.status(200).json({
      message: "Categories retrieved successfully",
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
}

module.exports = {
  getCategories,
};
