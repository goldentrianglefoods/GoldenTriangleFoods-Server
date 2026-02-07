const express = require('express');

const adminRoutes = express.Router();

const { getAllUsersController, getUserDetailsController } = require('../controllers/web/v1/admin-controller');
const authMiddleware = require('../middleware/authMiddleware');

// Route to get all users (admin only) 
adminRoutes.get('/get-all-users', authMiddleware, getAllUsersController);

// Route to get detailed user info (admin only)
adminRoutes.get('/get-user-details/:userId', authMiddleware, getUserDetailsController);


module.exports = adminRoutes;