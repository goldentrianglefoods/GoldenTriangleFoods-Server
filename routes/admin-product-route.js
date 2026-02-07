const express = require("express");
const { uploadProductController, deleteProductController, updateProductController } = require("../controllers/web/v1/admin-product-controller.js");
const { allProductController } = require("../controllers/web/v1/product-controller.js");
const { upload } = require("../middleware/multerMiddleware.js");

const adminProductRoutes = express.Router();

// add products route
adminProductRoutes.post(
  "/upload-product",
  upload.array("product-images", 5), // limit to 5 files
  uploadProductController
);


// fetch product route
adminProductRoutes.get("/get-all-product",allProductController);


// delete product route
adminProductRoutes.delete("/delete-product",deleteProductController);


// update product route
adminProductRoutes.patch("/update-product",upload.array("product-images", 5),updateProductController);

module.exports = adminProductRoutes;

