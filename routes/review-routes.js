const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { addReviewController, getProductReviewsController, voteReviewController } = require("../controllers/web/v1/review-controller");

const reviewRoutes = express.Router();

// add review route
reviewRoutes.post("/add-review",authMiddleware,addReviewController);

// get product reviews route
reviewRoutes.get("/get-product-reviews/:productId", getProductReviewsController);


// vote review route
reviewRoutes.patch("/vote-review/:reviewId",authMiddleware, voteReviewController);



module.exports = reviewRoutes;