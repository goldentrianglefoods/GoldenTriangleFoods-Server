const SubscriptionItem = require('../../../models/subscriptionItem-model');
const { FoodItem } = require('../../../models/foodItem-model');

/**
 * Get All Subscription Items (Admin)
 * GET /admin/subscription-items
 */
const getAllSubscriptionItems = async (req, res) => {
    try {
        const items = await SubscriptionItem.find()
            .populate('foodItem', 'name image price isVeg isActive tags')
            .sort({ sortOrder: 1 });

        res.status(200).json({
            status: true,
            items
        });
    } catch (error) {
        console.error("Error fetching subscription items:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch subscription items",
            error: error.message
        });
    }
};

/**
 * Get All Food Items for Selection (Admin)
 * GET /admin/subscription-items/food-items
 */
const getFoodItemsForSelection = async (req, res) => {
    try {
        // Get all active food items
        const foodItems = await FoodItem.find({ isActive: true, isDeleted: false })
            .select('name image price isVeg tags category')
            .populate('category', 'name')
            .sort({ name: 1 });

        // Get IDs of items already in subscription
        const existingItems = await SubscriptionItem.find().select('foodItem');
        const existingIds = existingItems.map(item => item.foodItem.toString());

        res.status(200).json({
            status: true,
            foodItems,
            existingIds
        });
    } catch (error) {
        console.error("Error fetching food items:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch food items",
            error: error.message
        });
    }
};

/**
 * Add Food Item to Subscription
 * POST /admin/subscription-items
 */
const addSubscriptionItem = async (req, res) => {
    try {
        const { foodItemId } = req.body;

        if (!foodItemId) {
            return res.status(400).json({
                status: false,
                message: "Food item ID is required"
            });
        }

        // Check if food item exists
        const foodItem = await FoodItem.findById(foodItemId);
        if (!foodItem) {
            return res.status(404).json({
                status: false,
                message: "Food item not found"
            });
        }

        // Check if already added
        const existing = await SubscriptionItem.findOne({ foodItem: foodItemId });
        if (existing) {
            return res.status(400).json({
                status: false,
                message: "This item is already in the subscription list"
            });
        }

        // Get max sort order
        const maxSort = await SubscriptionItem.findOne().sort({ sortOrder: -1 });
        const newSortOrder = maxSort ? maxSort.sortOrder + 1 : 0;

        const subscriptionItem = new SubscriptionItem({
            foodItem: foodItemId,
            sortOrder: newSortOrder
        });

        await subscriptionItem.save();

        // Populate and return
        await subscriptionItem.populate('foodItem', 'name image price isVeg isActive tags');

        res.status(201).json({
            status: true,
            message: "Item added to subscription successfully",
            item: subscriptionItem
        });
    } catch (error) {
        console.error("Error adding subscription item:", error);
        res.status(500).json({
            status: false,
            message: "Failed to add item to subscription",
            error: error.message
        });
    }
};

/**
 * Remove Subscription Item
 * DELETE /admin/subscription-items/:id
 */
const removeSubscriptionItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await SubscriptionItem.findByIdAndDelete(id);
        if (!item) {
            return res.status(404).json({
                status: false,
                message: "Subscription item not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Item removed from subscription successfully"
        });
    } catch (error) {
        console.error("Error removing subscription item:", error);
        res.status(500).json({
            status: false,
            message: "Failed to remove item",
            error: error.message
        });
    }
};

/**
 * Toggle Active Status
 * PUT /admin/subscription-items/:id/toggle
 */
const toggleSubscriptionItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await SubscriptionItem.findById(id);
        if (!item) {
            return res.status(404).json({
                status: false,
                message: "Subscription item not found"
            });
        }

        item.isActive = !item.isActive;
        await item.save();

        await item.populate('foodItem', 'name image price isVeg isActive tags');

        res.status(200).json({
            status: true,
            message: `Item ${item.isActive ? 'activated' : 'deactivated'} successfully`,
            item
        });
    } catch (error) {
        console.error("Error toggling subscription item:", error);
        res.status(500).json({
            status: false,
            message: "Failed to toggle item status",
            error: error.message
        });
    }
};

/**
 * Update Sort Order
 * PUT /admin/subscription-items/:id/sort
 */
const updateSortOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { sortOrder } = req.body;

        if (typeof sortOrder !== 'number') {
            return res.status(400).json({
                status: false,
                message: "Sort order must be a number"
            });
        }

        const item = await SubscriptionItem.findByIdAndUpdate(
            id,
            { sortOrder },
            { new: true }
        ).populate('foodItem', 'name image price isVeg isActive tags');

        if (!item) {
            return res.status(404).json({
                status: false,
                message: "Subscription item not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Sort order updated",
            item
        });
    } catch (error) {
        console.error("Error updating sort order:", error);
        res.status(500).json({
            status: false,
            message: "Failed to update sort order",
            error: error.message
        });
    }
};

module.exports = {
    getAllSubscriptionItems,
    getFoodItemsForSelection,
    addSubscriptionItem,
    removeSubscriptionItem,
    toggleSubscriptionItem,
    updateSortOrder
};
