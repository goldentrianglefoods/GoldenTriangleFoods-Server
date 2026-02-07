const { FoodItem } = require("../../../models/foodItem-model");
const Review = require("../../../models/review-model");

// controller for add a review for a food item
const addReviewController = async (req, res) => {
  try {
    // get foodItemId and userId(present in req -- bcoz middleware) with other fields from req body
    const { foodItemId, productId, rating, review, tags } = req.body;

    // Support both foodItemId and productId for backward compatibility
    const itemId = foodItemId || productId;

    // check if all fields are 
    if (!itemId || !rating || !review) {
      return res.status(400).json(
        { message: "All fields are required" }
      );
    }

    console.log("User ID from middleware:", req.user);

    // check if food item exists
    const foodItem = await FoodItem.findById(itemId);
    if (!foodItem) {
      return res.status(404).json(
        { message: "Food item not found" }
      );
    }

    // create review object
    const newReview = new Review({
      user: req.user._id,
      product: itemId, // keeping 'product' field name for backward compatibility
      userName: req.user.name, // from middleware
      rating,
      review,
      tags
    });

    // save review to db
    await newReview.save();

    // update food item's average rating and review count
    const foodItemReviews = await Review.find({ product: itemId });

    const reviewCount = foodItemReviews.length;

    const averageRating = foodItemReviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount;

    await FoodItem.findByIdAndUpdate(
      itemId,
      {
        averageRating,
        reviewCount
      },
      { new: true }
    );


    // send the response
    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: newReview
    });
  } catch (error) {
    // handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this item"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// CONTROLLER  for getting reviews for a product
const getProductReviewsController = async (req, res) => {
  try {
    const { productId } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = req.query.sort || "latest"; // latest | rating_high | rating_low

    const skip = (page - 1) * limit;

    let sortOption = { createdAt: -1 }; // default latest

    if (sort === "rating_high") sortOption = { rating: -1 };
    if (sort === "rating_low") sortOption = { rating: 1 };

    const reviews = await Review.find({ product: productId })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
    // .populate("user", "name");  // if you want to get more user details

    const totalReviews = await Review.countDocuments({ product: productId });

    res.status(200).json({
      success: true,
      message: "Product reviews fetched successfully",
      page,
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product reviews",
      error: error.message,
    });
  }
};

// controller up/down vote review
const voteReviewController = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { type } = req.body;
    const userId = req.user._id;

    // validate vote type
    if (!type || !["up", "down"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Vote type must be 'up' or 'down'",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // find existing vote by user
    const existingVote = review.votes.find(
      (v) => v.user.toString() === userId.toString()
    );

    // CASE 1: User already voted same type → BLOCK
    if (existingVote && existingVote.type === type) {
      return res.status(400).json({
        success: false,
        message: `You have already ${type}voted this review`,
      });
    }

    // CASE 2: User switching vote (up ↔ down)
    if (existingVote) {
      // remove previous vote count
      if (existingVote.type === "up") review.upVotes--;
      else review.downVotes--;

      // add new vote count
      if (type === "up") review.upVotes++;
      else review.downVotes++;

      // update vote type
      existingVote.type = type;
    }
    // CASE 3: First-time vote
    else {
      review.votes.push({ user: userId, type });

      if (type === "up") review.upVotes++;
      else review.downVotes++;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: "Vote recorded successfully",
      upVotes: review.upVotes,
      downVotes: review.downVotes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to vote on review",
      error: error.message,
    });
  }
};


module.exports = {
  addReviewController,
  getProductReviewsController,
  voteReviewController
}

