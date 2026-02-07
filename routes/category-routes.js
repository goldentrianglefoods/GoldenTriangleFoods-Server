const express = require("express");
const { upload } = require("../middleware/multerMiddleware");
const { createCategoryController, getAllCategoriesController, getCategoryByIdController, updateCategoryController, deleteCategoryController, getCategoryByQueryController } = require("../controllers/web/v1/category-controller");

const categoryRoutes = express.Router();

// add category route
categoryRoutes.post("/upload-category",upload.single("category-image"),createCategoryController);

// fetch all categories route
categoryRoutes.get("/get-all-categories",getAllCategoriesController);

// get single category route
categoryRoutes.get("/get-category/:id",getCategoryByIdController);  

// update category route
categoryRoutes.put("/update-category/:id",upload.single("category-image"),updateCategoryController);

// delete category route
categoryRoutes.delete("/delete-category/:id",deleteCategoryController);

// get category by search query
categoryRoutes.get("/search-categories",getCategoryByQueryController);


module.exports = categoryRoutes;