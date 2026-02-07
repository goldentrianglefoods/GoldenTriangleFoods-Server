const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllOrders,
    getOrderDetails,
    updateOrderStatus
} = require('../controllers/web/v1/admin-order-controller');

// All routes require authentication (admin check can be added later)
router.use(authMiddleware);

// Get all orders with filters and pagination
router.get('/orders', getAllOrders);

// Get single order details
router.get('/orders/:orderId', getOrderDetails);

// Update order status
router.patch('/orders/:orderId/status', updateOrderStatus);

module.exports = router;
