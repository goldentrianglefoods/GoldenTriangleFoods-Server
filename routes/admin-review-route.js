const express = require("express");
const { adminDeleteReviewController } = require("../controllers/web/v1/admin-review-controller");

const adminReviewRoutes = express.Router();

// Admin delete review route
adminReviewRoutes.delete("/delete-review/:reviewId",adminDeleteReviewController);

module.exports = adminReviewRoutes;