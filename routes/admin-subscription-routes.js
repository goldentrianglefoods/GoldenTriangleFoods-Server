const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const {
    // Plan CRUD
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    deletePlan,
    // Subscription Management
    getAllSubscriptions,
    getSubscriptionDetails,
    updateSubscriptionStatus,
    updateSubscriptionScheduleStatus,
    getSubscriptionStats
} = require('../controllers/web/v1/admin-subscription-controller');

// All routes require admin authentication
router.use(adminMiddleware);

// =====================
// SUBSCRIPTION PLANS CRUD
// =====================

// Get all subscription plans
router.get('/plans', getAllPlans);

// Create new subscription plan
router.post('/plan', createPlan);

// Get single plan by ID
router.get('/plan/:id', getPlanById);

// Update subscription plan
router.put('/plan/:id', updatePlan);

// Delete (deactivate) subscription plan
router.delete('/plan/:id', deletePlan);

// =====================
// USER SUBSCRIPTIONS MANAGEMENT
// =====================

// Get subscription stats for dashboard
router.get('/stats', getSubscriptionStats);

// Get all user subscriptions (with filters)
router.get('/orders', getAllSubscriptions);

// Get single subscription details
router.get('/order/:id', getSubscriptionDetails);

// Update subscription status
router.put('/order/:id/status', updateSubscriptionStatus);

// Update subscription schedule status
router.put('/order/:id/schedule/:scheduleId', updateSubscriptionScheduleStatus);

module.exports = router;
