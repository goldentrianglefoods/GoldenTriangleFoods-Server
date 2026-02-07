const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getSubscriptionPlans,
    createSubscription,
    verifySubscriptionPayment,
    getMySubscriptions,
    getSubscriptionById,
    getActiveSubscription,
    updateSubscriptionSchedule
} = require('../controllers/web/v1/subscription-controller');

// Public route - get available plans
router.get('/plans', getSubscriptionPlans);

// Protected routes - require authentication
router.use(authMiddleware);

// Create subscription with payment
router.post('/create', createSubscription);

// Verify payment and activate subscription
router.post('/verify-payment', verifySubscriptionPayment);

// Get user's subscriptions history
router.get('/my-subscriptions', getMySubscriptions);

// Check if user has active subscription
router.get('/active', getActiveSubscription);

// Get single subscription details
router.get('/:id', getSubscriptionById);

// Update schedule (date/time) for a subscription
router.patch('/:id/schedule/:scheduleId', updateSubscriptionSchedule);

module.exports = router;
