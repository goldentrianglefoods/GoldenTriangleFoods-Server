const { FoodItem } = require("../../../models/foodItem-model");
const cloudinary = require("cloudinary").v2;

// Create new food item
const createFoodItemController = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            originalPrice,
            discount,
            category,
            subCategory,
            tags,
            isVeg,
            isVegan,
            isGlutenFree,
            nutrition,
            prepTime,
            ingredients,
            allergens,
            image
        } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, message: "Name and price are required" });
        }

        const newFoodItem = new FoodItem({
            name,
            description,
            price,
            originalPrice: originalPrice || price,
            discount: discount || 0,
            category,
            subCategory,
            tags: tags || [],
            isVeg: isVeg !== undefined ? isVeg : true,
            isVegan: isVegan || false,
            isGlutenFree: isGlutenFree || false,
            nutrition: nutrition || {},
            prepTime,
            ingredients: ingredients || { base: [], removable: [], optional: [] },
            allergens: allergens || [],
            image: image || ''
        });

        await newFoodItem.save();

        return res.status(201).json({
            success: true,
            message: "Food item created successfully",
            foodItem: newFoodItem
        });
    } catch (error) {
        console.error("Create food item error:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Update food item
const updateFoodItemController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const foodItem = await FoodItem.findById(id);
        if (!foodItem) {
            return res.status(404).json({ success: false, message: "Food item not found" });
        }

        // Update fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                foodItem[key] = updateData[key];
            }
        });

        await foodItem.save();

        return res.status(200).json({
            success: true,
            message: "Food item updated successfully",
            foodItem
        });
    } catch (error) {
        console.error("Update food item error:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Delete food item (soft delete)
const deleteFoodItemController = async (req, res) => {
    try {
        const { id } = req.params;

        const foodItem = await FoodItem.findById(id);
        if (!foodItem) {
            return res.status(404).json({ success: false, message: "Food item not found" });
        }

        foodItem.isDeleted = true;
        foodItem.isActive = false;
        await foodItem.save();

        return res.status(200).json({
            success: true,
            message: "Food item deleted successfully"
        });
    } catch (error) {
        console.error("Delete food item error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all food items for admin (includes inactive)
const getAllFoodItemsAdminController = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, category, isActive } = req.query;

        const query = { isDeleted: false };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) {
            query.category = category;
        }
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const foodItems = await FoodItem.find(query)
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await FoodItem.countDocuments(query);

        return res.status(200).json({
            success: true,
            foodItems,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get all food items admin error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Toggle food item active status
const toggleFoodItemStatusController = async (req, res) => {
    try {
        const { id } = req.params;

        const foodItem = await FoodItem.findById(id);
        if (!foodItem) {
            return res.status(404).json({ success: false, message: "Food item not found" });
        }

        foodItem.isActive = !foodItem.isActive;
        await foodItem.save();

        return res.status(200).json({
            success: true,
            message: `Food item ${foodItem.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: foodItem.isActive
        });
    } catch (error) {
        console.error("Toggle food item status error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Upload food item image
const uploadFoodItemImageController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image provided" });
        }

        // Upload to cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "food-items",
            transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "auto" }
            ]
        });

        return res.status(200).json({
            success: true,
            imageUrl: result.secure_url,
            cloudinaryId: result.public_id
        });
    } catch (error) {
        console.error("Upload food item image error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    createFoodItemController,
    updateFoodItemController,
    deleteFoodItemController,
    getAllFoodItemsAdminController,
    toggleFoodItemStatusController,
    uploadFoodItemImageController
};
