const jwt = require("jsonwebtoken");
const User = require("../models/user-model");
require("dotenv").config();

/**
 * Optional Authentication Middleware
 * - If token exists and is valid, attach user to req.user
 * - If no token or invalid token, continue as guest (req.user = null)
 * - Does NOT block the request like authMiddleware
 */
const optionalAuthMiddleware = async (req, res, next) => {
  const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    // No token provided, continue as guest
    req.user = null;
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Fetch full user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      // Invalid user, continue as guest
      req.user = null;
      return next();
    }

    // Attach full user object
    req.user = user;
    next();
  } catch (err) {
    // Invalid or expired token, continue as guest
    req.user = null;
    next();
  }
};

module.exports = optionalAuthMiddleware;
