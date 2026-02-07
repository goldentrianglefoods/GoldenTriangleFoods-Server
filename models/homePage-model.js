
const { constants } = require("crypto");
const mongoose = require("mongoose");

/* ---------- Product Summary (Embedded) ---------- */
const productSummarySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: String,
    price: Number,
    originalPrice: Number,
    imageUrl: String,
    discountPercentage: Number,
  },
  { _id: false }
);

/* ---------- Hero Carousel ---------- */
const heroCarouselSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    redirectUrl: { type: String },
    altText: { type: String },
  },
  { _id: false }
);

/* ---------- Featured Section ---------- */
const featuredSectionSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    title: String,
    subtitle: String,
    redirectUrl: String,
  },
  { _id: false }
);

/* ---------- Stealz of Month ---------- */
const stealzOfMonthSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Stealz of the Month",
    },
    products: [productSummarySchema],
  },
  { _id: false }
);

/* ---------- Collection Sections ---------- */
const collectionSectionSchema = new mongoose.Schema(
  {
    sectionTitle: { type: String, required: true },
    sectionSlug: {
      type: String,
      enum: [
        "anime-drip",
        "cinephile-stealz",
        "hot-girls-picks",
        "main-character-drip",
        "top-charts",
      ],
      required: true,
    },
    products: [productSummarySchema],
  },
  { _id: false }
);

/* ---------- Home Page ---------- */
const homePageSchema = new mongoose.Schema(
  {
    heroCarousel: {
      type: [heroCarouselSchema],
      validate: [arr => arr.length <= 3, "Max 3 hero banners allowed"],
    },
    featuredSection: {
      type: [featuredSectionSchema],
      validate: [arr => arr.length <= 2, "Max 2 featured banners allowed"],
    },
    stealzOfMonth: stealzOfMonthSchema,
    collectionSections: [collectionSectionSchema],
  },
  { timestamps: true }
);

const HomePage = mongoose.model("HomePage", homePageSchema);

module.exports = HomePage;









// const mongoose = require("mongoose");  

// const homePageSchema = new mongoose.Schema({
//   heroCarousel: [
//     {
//       imageUrl: String,
//       redirectUrl: String,
//       altText: String,
//     },
//   ],

//   featuredSection: [
//     {
//       imageUrl: String,
//       title: String,
//       subtitle: String,
//       redirectUrl: String,
//     },
//   ],

//   stealzOfMonth: {
//     title: String,
//     products: [
//       {
//         id: String,
//         name: String,
//         price: Number,
//         originalPrice: Number,
//         imageUrl: String,
//         discountPercentage: Number,
//       },
//     ],
//   },

//   collectionSections: [
//     {
//       sectionTitle: String,
//       sectionSlug: String,
//       products: [
//         {
//           id: String,
//           name: String,
//           price: Number,
//           originalPrice: Number,
//           imageUrl: String,
//           discountPercentage: Number,
//         },
//       ],
//     },
//   ],
// });

// const HomePage = mongoose.model("HomePage", homePageSchema);

// module.exports = HomePage;
