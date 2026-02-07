const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Custom User-Based Rate Limiter
 * - For authenticated users: Rate limit by userId
 * - For guest users: Rate limit by IP address
 * - Provides better experience for multiple users on same network
 */

// In-memory storage for rate limits
// Structure: { key: { count: number, resetTime: timestamp } }
const rateLimitStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

const userRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
  } = options;

  return async (req, res, next) => {
    try {
      let rateLimitKey;
      let keyType = "IP";

      // Try to get user from JWT token
      const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', '');
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          if (decoded && decoded.id) {
            // Authenticated user - use userId as key
            rateLimitKey = `user:${decoded.id}`;
            keyType = "User";
          }
        } catch (err) {
          // Invalid token, fall back to IP
        }
      }

      // If no valid user token, use IP address
      if (!rateLimitKey) {
        const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        rateLimitKey = `ip:${ip}`;
        keyType = "IP";
      }

      const now = Date.now();
      let record = rateLimitStore.get(rateLimitKey);

      // Initialize or reset if window expired
      if (!record || now > record.resetTime) {
        record = {
          count: 0,
          resetTime: now + windowMs
        };
      }

      // Increment request count
      record.count++;
      rateLimitStore.set(rateLimitKey, record);

      // Calculate remaining requests and reset time
      const remaining = Math.max(0, max - record.count);
      const resetTimeSeconds = Math.ceil(record.resetTime / 1000);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTimeSeconds);

      // Check if limit exceeded
      if (record.count > max) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        const minutesRemaining = Math.ceil(retryAfter / 60);
        
        res.setHeader('Retry-After', retryAfter);
        
        return res.status(429).json({
          success: false,
          message: `Too many requests. Please try again after ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`,
          retryAfter: retryAfter,
          limit: max,
          windowMs: windowMs / 60000 // Convert to minutes
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request to proceed (fail open for availability)
      next();
    }
  };
};

module.exports = userRateLimiter;
