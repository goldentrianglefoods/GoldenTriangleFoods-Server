const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      required: true
    },

    userName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    review: {
      type: String,
      trim: true,
      required: true
    },

    tags: {
      type: [String],
      default: []
    },

    // Aggregate counters (FAST)
    upVotes: {
      type: Number,
      default: 0
    },

    downVotes: {
      type: Number,
      default: 0
    },

    // User-level vote tracking (PREVENT MULTIPLE VOTES)
    votes: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
          },
          type: {
            type: String,
            enum: ["up", "down"],
            required: true
          }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Prevent same user appearing multiple times in votes array
reviewSchema.index({ _id: 1, "votes.user": 1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
