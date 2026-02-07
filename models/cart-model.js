const mongoose = require("mongoose");

// Food customization sub-schema
const foodCustomizationSchema = new mongoose.Schema({
  removedIngredients: [{ type: String }],  // Ingredients user removed
  addedOptionals: [{
    name: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  specialInstructions: { type: String, default: "" }
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
  foodItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem",
    required: true
  },

  // Food customization (replaces old 'size' field for clothing)
  customization: foodCustomizationSchema,

  quantity: {
    type: Number,
    min: 1,
    required: true
  },

  // Base price of the food item
  priceSnapshot: {
    type: Number,
    required: true
  },

  // Extra cost from optional add-ons
  addOnsTotal: {
    type: Number,
    default: 0
  }

}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  items: {
    type: [cartItemSchema],
    default: []
  },

  total: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;