const express = require("express");
const {
    getAllFoodItemsController,
    getFoodItemByIdController,
    searchFoodItemsController,
    getFoodItemsByCategoryController,
    getHomePageDataController,
    getFoodItemWithReviewsController
} = require("../controllers/web/v1/foodItem-controller");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const foodItemRoutes = express.Router();

// ========== HOME PAGE ==========
// Get home page data (popular items, bestsellers, etc.)
foodItemRoutes.get("/get-home-page-data", getHomePageDataController);

// ========== FOOD ITEMS ==========
// Get all food items with pagination
foodItemRoutes.get("/get-all-fooditems", getAllFoodItemsController);

// Search food items
foodItemRoutes.get("/get-fooditems/search", searchFoodItemsController);

// Get food items by category
foodItemRoutes.get("/get-fooditems/category/:category", getFoodItemsByCategoryController);

// Get single food item with reviews (optimized) - uses optional auth for wishlist status
foodItemRoutes.get("/get-fooditem-combined/:id", optionalAuthMiddleware, getFoodItemWithReviewsController);

// Get single food item
foodItemRoutes.get("/get-fooditem/:id", getFoodItemByIdController);

module.exports = foodItemRoutes;
