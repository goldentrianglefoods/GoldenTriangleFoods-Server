const express = require("express");
const {
    createFoodItemController,
    updateFoodItemController,
    deleteFoodItemController,
    getAllFoodItemsAdminController,
    toggleFoodItemStatusController,
    uploadFoodItemImageController
} = require("../controllers/web/v1/admin-foodItem-controller");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { upload } = require("../middleware/multerMiddleware");

const adminFoodItemRoutes = express.Router();

// All admin routes require authentication and admin role
adminFoodItemRoutes.use(authMiddleware);
adminFoodItemRoutes.use(adminMiddleware);

// ========== ADMIN FOOD ITEM CRUD ==========

// Get all food items for admin (includes inactive)
adminFoodItemRoutes.get("/get-all-fooditems", getAllFoodItemsAdminController);

// Create new food item
adminFoodItemRoutes.post("/create-fooditem", createFoodItemController);

// Update food item
adminFoodItemRoutes.put("/update-fooditem/:id", updateFoodItemController);

// Delete food item (soft delete)
adminFoodItemRoutes.delete("/delete-fooditem/:id", deleteFoodItemController);

// Toggle food item active status
adminFoodItemRoutes.patch("/toggle-status/:id", toggleFoodItemStatusController);

// Upload food item image
adminFoodItemRoutes.post("/upload-image", upload.single("image"), uploadFoodItemImageController);

module.exports = adminFoodItemRoutes;
