const jwt = require("jsonwebtoken");
const User = require("../models/user-model");
require("dotenv").config();

const authMiddleware = async (req, res, next) => {
  let token = req.cookies.accessToken;

  // Check Authorization header if cookie is missing
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Fetch full user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach full user object
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Not authorized, invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
