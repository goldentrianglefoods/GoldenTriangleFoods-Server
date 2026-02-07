
const express = require("express");
const { categoryProductController } = require("../controllers/web/v1/product-controller");
const { upload } = require("../middleware/multerMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const { getAllCategoriesController, getCategoryByIdController, getCategoryByQueryController } = require("../controllers/web/v1/category-controller");

const userCategoryRoutes = express.Router();

// fetch all categories route
userCategoryRoutes.get("/get-all-categories",authMiddleware,getAllCategoriesController);

// get single category route
userCategoryRoutes.get("/get-category/:id",authMiddleware,getCategoryByIdController);  


// get category by search query
userCategoryRoutes.get("/search-category",authMiddleware,getCategoryByQueryController);

// get products by category
userCategoryRoutes.get("/category-products/:id",authMiddleware,categoryProductController);



module.exports = userCategoryRoutes;