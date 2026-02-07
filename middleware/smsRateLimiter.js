const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for SMS OTP endpoints
 * Stricter limits due to SMS costs
 */
const smsOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 SMS requests per 15 minutes per IP
  message: {
    error: "Too many SMS OTP requests. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key generator to track by phone number or IP
  keyGenerator: (req) => {
    // Use phone number if provided, otherwise IP
    return req.body.phone || req.ip;
  }
});

/**
 * Rate limiter for forgot password endpoints
 * Prevent abuse of password reset
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    error: "Too many password reset attempts. Please try again after 1 hour."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.body.phone || req.ip;
  }
});

/**
 * General OTP rate limiter (email or SMS)
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 OTP requests per 10 minutes
  message: {
    error: "Too many OTP requests. Please try again after 10 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.body.phone || req.ip;
  }
});

module.exports = {
  smsOtpLimiter,
  forgotPasswordLimiter,
  otpLimiter
};
