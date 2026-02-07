const { Product } = require("../../../models/product-model");
const Review = require("../../../models/review-model");

// ADMIN: Delete any review
const adminDeleteReviewController = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const productId = review.product;

    await review.deleteOne();

    // Recalculate product rating
    const remainingReviews = await Review.find({ product: productId });

    const reviewCount = remainingReviews.length;

    const averageRating =
      reviewCount === 0
        ? 0
        : remainingReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

    await Product.findByIdAndUpdate(productId, {
      reviewCount,
      averageRating,
    });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

module.exports = { adminDeleteReviewController };
