const express = require("express");
const { addToWishlistController, removeFromWishlistController, getWishlistController, toggleWishlistController, clearWishlistController } = require("../controllers/web/v1/wishlist-controller");
const authMiddleware =require('../middleware/authMiddleware');
const wishlistRoutes = express.Router();

// Route for adding to wishlist
wishlistRoutes.post("/add-wishlist",authMiddleware, addToWishlistController);

// route for removing from wishlist
wishlistRoutes.delete("/remove-wishlist",authMiddleware, removeFromWishlistController);

// route for getting wishlist can be added here
wishlistRoutes.get("/get-wishlist",authMiddleware, getWishlistController);

// route for toggle wishlist
wishlistRoutes.post("/toggle-wishlist",authMiddleware,toggleWishlistController);

// route for clear wishlist
wishlistRoutes.delete("/clear-wishlist",authMiddleware, clearWishlistController);



module.exports = wishlistRoutes;

