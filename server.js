const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const userRateLimiter = require("./middleware/userRateLimiter");
const authRoutes = require("./routes/auth-routes");
const adminProductRoutes = require("./routes/admin-product-route");
const productRoutes = require("./routes/product-routes");
const offerRoutes = require("./routes/offer-routes");
const categoryRoutes = require("./routes/category-routes");
const userCategoryRoutes = require("./routes/user-category-routes");
const userOfferRoutes = require("./routes/user-offer-routes");
const adminRoutes = require("./routes/admin-routes");
const userRouter = require("./routes/user-route");
const reviewRoutes = require("./routes/review-routes");
const adminReviewRoutes = require("./routes/admin-review-route");
const cartRoute = require("./routes/cart-routes");
const wishlistRoutes = require("./routes/wishlist-routes");
const addressRoutes = require("./routes/address-routes");
const orderRoutes = require("./routes/order-routes");
const adminOrderRoutes = require("./routes/admin-order-routes");
const newsletterRoutes = require("./routes/newsletter-routes");
const foodItemRoutes = require("./routes/foodItem-routes");
const adminFoodItemRoutes = require("./routes/admin-foodItem-routes");
const subscriptionRoutes = require("./routes/subscription-routes");
const adminSubscriptionRoutes = require("./routes/admin-subscription-routes");
const subscriptionItemRoutes = require("./routes/subscriptionItem-routes");
const adminSubscriptionItemRoutes = require("./routes/admin-subscriptionItem-routes");
require("dotenv").config();


const app = express();

// Trust proxy - required for cookies to work behind Render's proxy
app.set('trust proxy', 1);

app.use(cookieParser());

// Security headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests for API
  contentSecurityPolicy: false // Disable CSP for API server
}));

// Rate limiting configuration
// User-based rate limiter - Each logged-in user gets 100 requests per 15 minutes
// Guest users share IP-based limit (100 requests per 15 minutes per IP)
const hybridRateLimiter = userRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});

// Strict rate limit for login (prevent brute force attacks)
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 login attempts per hour per IP
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply user-based rate limiting to all API routes
// This allows multiple logged-in users on the same WiFi to have individual limits
app.use('/api/', hybridRateLimiter);

// Apply strict rate limiting to login routes
app.use('/api/v1/user/login', loginLimiter);
app.use('/api/v1/user/signup', loginLimiter);
app.use('/api/v1/admin/login', loginLimiter);

// CORS Configuration - supports both development and production
const allowedOrigins = [
'https://client-1-gtf-admin-git-main-rahulkumar1430s-projects.vercel.app/',
'https://goldentrianglefood.vercel.app/',
  'http://localhost:3000',
  'http://localhost:3001',
];

// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (mobile apps, Postman, etc.)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.indexOf(origin) !== -1 || process.env.FRONTEND_URL === origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));
app.use(cors({
  origin: true,      // reflect request origin, effectively allowing all origins
  credentials: true  // allow cookies/auth to be sent
}));
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Balance Backend is running',
    timestamp: new Date().toISOString()
  });
});



// get all users - admin
app.use("/api/v1/admin", adminRoutes);


// Route for Authentication
app.use("/api/v1/user", authRoutes);


// Route for Category(CRUD)
app.use("/api/v1/admin", categoryRoutes);


// Route for user category(ONLY retrieval)
app.use("/api/v1/user", userCategoryRoutes);


// Route for admin-product
app.use("/api/v1/admin", adminProductRoutes);

// products 
app.use("/api/v1/user", productRoutes);


// offer - Admin
app.use("/api/v1/admin", offerRoutes);

// offer - User
app.use("/api/v1/user", userOfferRoutes);

// user - routes
app.use("/api/v1/user", userRouter);


// Review Routes
app.use("/api/v1/user", reviewRoutes);

// Admin review routes
app.use("/api/v1/admin", adminReviewRoutes);


// Cart Routes
app.use("/api/v1/user", cartRoute);


// Wishlist Routes
app.use("/api/v1/user", wishlistRoutes);

// Address Routes
app.use("/api/v1/address", addressRoutes);

// Order Routes
app.use("/api/v1/order", orderRoutes);

// Admin Order Routes
app.use("/api/v1/admin", adminOrderRoutes);

// Newsletter Routes
app.use("/api/v1/newsletter", newsletterRoutes);

// Food Item Routes - User
app.use("/api/v1/food", foodItemRoutes);

// Food Item Routes - Admin
app.use("/api/v1/admin/food", adminFoodItemRoutes);

// Subscription Routes - User
app.use("/api/v1/subscription", subscriptionRoutes);

// Subscription Routes - Admin
app.use("/api/v1/admin/subscription", adminSubscriptionRoutes);

// Subscription Items Routes - Public
app.use("/api/v1/subscription-items", subscriptionItemRoutes);

// Subscription Items Routes - Admin
app.use("/api/v1/admin/subscription-items", adminSubscriptionItemRoutes);
// Start server first to avoid platform startup timeouts
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// MongoDB Connection (async)
mongoose.connect(process.env.MONGODB_URL, {
  serverSelectionTimeoutMS: 10000
}).then(() => {
  console.log("✅ Database connected successfully");
}).catch((err) => {
  console.error("❌ Database connection error:", err.message);
  process.exit(1);
});

