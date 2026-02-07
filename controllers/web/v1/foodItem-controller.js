const { FoodItem } = require("../../../models/foodItem-model");

// Get all food items (with pagination)
const getAllFoodItemsController = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, isVeg } = req.query;

        const query = { isActive: true, isDeleted: false };

        if (category) {
            query.category = category;
        }
        if (isVeg !== undefined) {
            query.isVeg = isVeg === 'true';
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
        console.error("Get all food items error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get single food item by ID
const getFoodItemByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        const foodItem = await FoodItem.findOne({
            _id: id,
            isActive: true,
            isDeleted: false
        }).populate('category', 'name');

        if (!foodItem) {
            return res.status(404).json({ success: false, message: "Food item not found" });
        }

        return res.status(200).json({ success: true, foodItem });
    } catch (error) {
        console.error("Get food item by ID error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Search food items
const searchFoodItemsController = async (req, res) => {
    try {
        const { query, isVeg, category } = req.query;

        if (!query) {
            return res.status(400).json({ success: false, message: "Search query required" });
        }

        const searchQuery = {
            isActive: true,
            isDeleted: false,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } }
            ]
        };

        if (isVeg !== undefined) {
            searchQuery.isVeg = isVeg === 'true';
        }
        if (category) {
            searchQuery.category = category;
        }

        const foodItems = await FoodItem.find(searchQuery)
            .populate('category', 'name')
            .sort({ averageRating: -1 })
            .limit(50);

        return res.status(200).json({
            success: true,
            products: foodItems,  // Keep 'products' key for frontend compatibility
            count: foodItems.length
        });
    } catch (error) {
        console.error("Search food items error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get food items by category
const getFoodItemsByCategoryController = async (req, res) => {
    try {
        const { category } = req.params;
        const { isVeg, subCategory } = req.query;

        const query = {
            isActive: true,
            isDeleted: false,
            category: category
        };

        if (isVeg !== undefined) {
            query.isVeg = isVeg === 'true';
        }
        if (subCategory) {
            query.subCategory = subCategory;
        }

        const foodItems = await FoodItem.find(query)
            .populate('category', 'name')
            .sort({ averageRating: -1 });

        return res.status(200).json({
            success: true,
            foodItems,
            count: foodItems.length
        });
    } catch (error) {
        console.error("Get food items by category error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get home page data (popular items, category-wise items)
const getHomePageDataController = async (req, res) => {
    try {
        // Get popular items (by rating and sold count)
        const popularItems = await FoodItem.find({
            isActive: true,
            isDeleted: false
        })
            .sort({ averageRating: -1, soldCount: -1 })
            .limit(8);

        // Get bestsellers
        const bestsellers = await FoodItem.find({
            isActive: true,
            isDeleted: false,
            tags: { $in: ['BestSeller'] }
        })
            .limit(8);

        // Get vegan items
        const veganItems = await FoodItem.find({
            isActive: true,
            isDeleted: false,
            isVegan: true
        })
            .limit(8);

        // Get new arrivals
        const newArrivals = await FoodItem.find({
            isActive: true,
            isDeleted: false
        })
            .sort({ createdAt: -1 })
            .limit(8);

        return res.status(200).json({
            success: true,
            popularItems,
            bestsellers,
            veganItems,
            newArrivals
        });
    } catch (error) {
        console.error("Get home page data error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get single food item with reviews (optimized endpoint)
const getFoodItemWithReviewsController = async (req, res) => {
    try {
        const { id } = req.params;
        const Review = require("../../../models/review-model");

        const foodItem = await FoodItem.findOne({
            _id: id,
            isActive: true,
            isDeleted: false
        }).populate('category', 'name');

        if (!foodItem) {
            return res.status(404).json({ success: false, message: "Food item not found" });
        }

        // Get reviews for this food item
        const reviews = await Review.find({ product: id })
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        // Check if user has this in wishlist (if authenticated)
        let isWishlisted = false;
        if (req.user) {
            const User = require("../../../models/user-model");
            const user = await User.findById(req.user.id);
            isWishlisted = user?.wishlist?.includes(id) || false;
        }

        return res.status(200).json({
            success: true,
            foodItem,
            reviews,
            isWishlisted
        });
    } catch (error) {
        console.error("Get food item with reviews error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    getAllFoodItemsController,
    getFoodItemByIdController,
    searchFoodItemsController,
    getFoodItemsByCategoryController,
    getHomePageDataController,
    getFoodItemWithReviewsController
};
