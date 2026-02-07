const express = require("express");
const {
    addToCartController,
    updateCartItemController,
    removeFromCartController,
    getCartController,
    clearCartController,
    updateSpecialInstructionsController
} = require("../controllers/web/v1/cart-controller");
const authMiddleware = require("../middleware/authMiddleware");


const cartRoute = express.Router();

// Route for add food item to cart (with customization)
cartRoute.post("/add-to-cart", authMiddleware, addToCartController);

// Route for update cart item quantity
cartRoute.put("/update-cart-item", authMiddleware, updateCartItemController);

// Route for update special instructions for a cart item
cartRoute.put("/update-instructions", authMiddleware, updateSpecialInstructionsController);

// Route for remove from cart (by foodItemId or by index)
cartRoute.delete("/remove-cart-item/:foodItemId{/:itemIndex}", authMiddleware, removeFromCartController);

// Route for get cart
cartRoute.get("/get-cart", authMiddleware, getCartController);

// Route for clear cart
cartRoute.delete("/clear-cart", authMiddleware, clearCartController);


module.exports = cartRoute;