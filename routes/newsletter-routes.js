const express = require('express');
const newsletterRouter = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  subscribe,
  getAllSubscribers,
  sendCampaign,
  getCampaigns,
  getCampaignDetails,
  unsubscribe
} = require('../controllers/newsletter-controller');

// Public route - Subscribe to newsletter
newsletterRouter.post('/subscribe', subscribe);

// Admin routes - Require authentication and admin privileges
newsletterRouter.get('/subscribers', authMiddleware, adminMiddleware, getAllSubscribers);
newsletterRouter.post('/send-campaign', authMiddleware, adminMiddleware, sendCampaign);
newsletterRouter.get('/campaigns', authMiddleware, adminMiddleware, getCampaigns);
newsletterRouter.get('/campaigns/:id', authMiddleware, adminMiddleware, getCampaignDetails);
newsletterRouter.delete('/unsubscribe/:id', authMiddleware, adminMiddleware, unsubscribe);

module.exports = newsletterRouter;
