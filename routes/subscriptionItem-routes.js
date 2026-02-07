const express = require('express');
const router = express.Router();
const SubscriptionItem = require('../models/subscriptionItem-model');

/**
 * Get Active Subscription Items (Public)
 * GET /subscription-items/items
 */
router.get('/items', async (req, res) => {
    try {
        const items = await SubscriptionItem.find({ isActive: true })
            .populate({
                path: 'foodItem',
                select: 'name description image price isVeg tags ingredients nutrition',
                match: { isActive: true, isDeleted: false }
            })
            .sort({ sortOrder: 1 });

        // Filter out items where foodItem is null (inactive/deleted food items)
        const validItems = items
            .filter(item => item.foodItem !== null)
            .map(item => ({
                id: item.foodItem._id,
                name: item.foodItem.name,
                description: item.foodItem.description,
                image: item.foodItem.image,
                price: item.foodItem.price,
                isVeg: item.foodItem.isVeg,
                tags: item.foodItem.tags || [],
                ingredients: item.foodItem.ingredients,
                nutrition: item.foodItem.nutrition
            }));

        res.status(200).json({
            status: true,
            success: true,
            items: validItems
        });
    } catch (error) {
        console.error("Error fetching subscription items:", error);
        res.status(500).json({
            status: false,
            success: false,
            message: "Failed to fetch subscription items",
            error: error.message
        });
    }
});

module.exports = router;
