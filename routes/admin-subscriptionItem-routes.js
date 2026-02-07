const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const {
    getAllSubscriptionItems,
    getFoodItemsForSelection,
    addSubscriptionItem,
    removeSubscriptionItem,
    toggleSubscriptionItem,
    updateSortOrder
} = require('../controllers/web/v1/admin-subscriptionItem-controller');

// All routes require admin authentication
router.use(adminMiddleware);

// Get all subscription items
router.get('/', getAllSubscriptionItems);

// Get all food items for selection (shows which are already added)
router.get('/food-items', getFoodItemsForSelection);

// Add food item to subscription
router.post('/', addSubscriptionItem);

// Remove item from subscription
router.delete('/:id', removeSubscriptionItem);

// Toggle active status
router.put('/:id/toggle', toggleSubscriptionItem);

// Update sort order
router.put('/:id/sort', updateSortOrder);

module.exports = router;
