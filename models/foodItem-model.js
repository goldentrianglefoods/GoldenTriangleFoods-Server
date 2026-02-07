const mongoose = require("mongoose");

// Ingredient sub-schemas
const baseIngredientSchema = new mongoose.Schema({
    name: { type: String, required: true }
}, { _id: false });

const removableIngredientSchema = new mongoose.Schema({
    name: { type: String, required: true }
}, { _id: false });

const optionalIngredientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 }
}, { _id: false });

// Nutrition sub-schema
const nutritionSchema = new mongoose.Schema({
    kcal: { type: Number, default: 0 },
    protein: { type: String, default: "0g" },
    carbs: { type: String, default: "0g" },
    fat: { type: String, default: "0g" },
    fiber: { type: String, default: "0g" }
}, { _id: false });

// Main FoodItem schema
const foodItemSchema = new mongoose.Schema({
    // Basic Info
    name: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String, default: '' },  // Single Cloudinary URL

    // Pricing
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: Number, default: 0 },

    // Categorization
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subCategory: { type: String },
    tags: [{ type: String }],  // ["Vegan", "Gluten Free", "BestSeller"]

    // Dietary Info
    isVeg: { type: Boolean, default: true },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },

    // Nutritional Information
    nutrition: nutritionSchema,

    // Preparation
    prepTime: { type: String },  // "15-20 min"

    // Ingredients (for customization)
    ingredients: {
        base: [baseIngredientSchema],           // Can't be removed
        removable: [removableIngredientSchema], // User can untick
        optional: [optionalIngredientSchema]    // Extra charge
    },

    // Allergens
    allergens: [{ type: String }],

    // Ratings & Reviews
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    // Inventory & Status
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    // Stats
    soldCount: { type: Number, default: 0 }

}, { timestamps: true });

// Index for fast searching
foodItemSchema.index({ name: 'text', description: 'text' });

const FoodItem = mongoose.model("FoodItem", foodItemSchema);
module.exports = { FoodItem };
