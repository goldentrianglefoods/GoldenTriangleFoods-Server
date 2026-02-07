const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    initiateOrder,
    createRazorpayOrder,
    verifyAndCompleteOrder,
    placeCodOrder,
    getUserOrders,
    getOrderById
} = require('../controllers/web/v1/order-controller');

// All routes require authentication
router.use(authMiddleware);

// Initiate order from cart
router.post('/initiate', initiateOrder);

// Create Razorpay order for payment
router.post('/create-razorpay-order', createRazorpayOrder);

// Verify payment and complete order
router.post('/verify-and-complete', verifyAndCompleteOrder);

// Place COD order
router.post('/cod', placeCodOrder);

// Get user's order history
router.get('/my-orders', getUserOrders);

// Get single order details
router.get('/:orderId', getOrderById);

module.exports = router;
