const express = require("express");
const { 
  signUpController, 
  signInController, 
  sendOtpController, 
  verifyOtpController, 
  refreshToken, 
  logout, 
  getUserController,
  sendForgotPasswordOtpController,
  verifyForgotPasswordOtpController,
  resetPasswordController
} = require("../controllers/web/v1/auth-controller");
const authMiddleware = require("../middleware/authMiddleware");
const { otpLimiter, forgotPasswordLimiter } = require("../middleware/smsRateLimiter");
const authRoutes = express.Router();


// Step 1: Send OTP (for registration - supports email or phone)
authRoutes.post("/send-otp", otpLimiter, sendOtpController);

// Step 2: Verify OTP (for registration - supports email or phone)
authRoutes.post("/verify-otp", verifyOtpController);

// signUp route (supports email or phone)
authRoutes.post("/sign-up",signUpController);

// login route (supports email or phone)
authRoutes.post("/sign-in",signInController);

// Forgot Password routes
authRoutes.post("/forgot-password/send-otp", forgotPasswordLimiter, sendForgotPasswordOtpController);
authRoutes.post("/forgot-password/verify-otp", verifyForgotPasswordOtpController);
authRoutes.post("/forgot-password/reset", resetPasswordController);

// refresh token
authRoutes.post("/refresh",refreshToken);

// log-out route
authRoutes.post("/logout",logout);

// get -user-route
authRoutes.get("/get-user",authMiddleware,getUserController);

module.exports = authRoutes;