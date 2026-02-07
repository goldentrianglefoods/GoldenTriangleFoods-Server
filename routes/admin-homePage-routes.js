const express = require("express");
const { upload } = require("../middleware/multerMiddleware");
const { uploadHomePageController, getHomePageController, deleteHomePageByIdController } = require("../controllers/web/v1/admin-homePage-controller");



const adminHomePageRoutes = express.Router();

// route for creating or updating home page content
adminHomePageRoutes.post(
  "/upload-homePage",
  upload.fields([
    { name: "heroImages", maxCount: 3 },
    { name: "featuredImages", maxCount: 2 },
  ]),
    uploadHomePageController
);


// route for getting home page content
adminHomePageRoutes.get(
  "/get-homePage",
  getHomePageController
);

// route for deleting home page content by ID
adminHomePageRoutes.delete(
  "/delete-homePage",
  deleteHomePageByIdController
);



module.exports = adminHomePageRoutes;