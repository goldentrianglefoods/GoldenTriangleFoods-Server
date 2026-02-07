const express = require("express");
const { 
  allProductController, 
  categoryProductController, 
  searchProductController, 
  singleProductController, 
  categorySearchProductController,
  getHomePageDataController,
  getSingleProductWithReviewsController
} = require("../controllers/web/v1/product-controller");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const productRoutes = express.Router();


// ========== OPTIMIZED ENDPOINTS ==========

// OPTIMIZATION #1: Home page data - consolidates 5 search calls into 1
productRoutes.get("/get-home-page-data", getHomePageDataController);

// OPTIMIZATION #2: Product with reviews & wishlist - combines 3 calls into 1
// Uses optional auth so guests can view, but authenticated users see wishlist status
productRoutes.get("/get-product-combined/:id", optionalAuthMiddleware, getSingleProductWithReviewsController);


// ========== EXISTING ENDPOINTS ==========

// fetch product route
productRoutes.get("/get-all-product", allProductController);

// get product by category
productRoutes.get("/get-product/category/:category", categoryProductController);

// get product by search
productRoutes.get("/get-product/search", searchProductController);

// get products by category name search
productRoutes.get("/get-product/category-search", categorySearchProductController);

// get single product
productRoutes.get("/get-product/:id", singleProductController);

module.exports = productRoutes;
