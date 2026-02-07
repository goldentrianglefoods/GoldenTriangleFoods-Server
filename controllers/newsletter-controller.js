const Newsletter = require('../models/newsletter-model');
const EmailCampaign = require('../models/emailCampaign-model');
const { sendEmail, sendBulkEmails, createEmailTemplate, createWelcomeEmailTemplate } = require('../utils/emailService');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });
    
    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({ message: 'This email is already subscribed' });
      } else {
        // Reactivate subscription
        existingSubscriber.isActive = true;
        existingSubscriber.subscribedAt = new Date();
        await existingSubscriber.save();
        
        // Send welcome email
        const welcomeEmail = createWelcomeEmailTemplate();
        await sendEmail(email, 'Welcome to Balance Newsletter!', welcomeEmail);
        
        return res.status(200).json({ 
          message: 'Successfully resubscribed to newsletter',
          subscriber: existingSubscriber 
        });
      }
    }

    // Create new subscriber
    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    // Send welcome email
    const welcomeEmail = createWelcomeEmailTemplate();
    await sendEmail(email, 'Welcome to Balance Newsletter!', welcomeEmail);

    res.status(201).json({ 
      message: 'Successfully subscribed to newsletter',
      subscriber: newSubscriber 
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ message: 'Failed to subscribe', error: error.message });
  }
};

// Get all subscribers (Admin only)
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true })
      .sort({ subscribedAt: -1 });

    res.status(200).json({ 
      success: true,
      count: subscribers.length,
      subscribers 
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ message: 'Failed to fetch subscribers', error: error.message });
  }
};

// Send email campaign (Admin only)
exports.sendCampaign = async (req, res) => {
  try {
    const { title, message, recipientEmails } = req.body;
    const adminEmail = req.user?.email || 'admin@balance.com';

    console.log('[NewsletterController] Received campaign send request');
    console.log('[NewsletterController] Title:', title);
    console.log('[NewsletterController] Recipients:', recipientEmails);
    console.log('[NewsletterController] Admin:', adminEmail);

    if (!title || !message || !recipientEmails || recipientEmails.length === 0) {
      return res.status(400).json({ message: 'Title, message, and recipients are required' });
    }

    // Create email template
    const emailHtml = createEmailTemplate(title, message);

    console.log('[NewsletterController] Calling sendBulkEmails...');
    // Send bulk emails
    const results = await sendBulkEmails(recipientEmails, title, emailHtml);
    console.log('[NewsletterController] sendBulkEmails completed');
    console.log('[NewsletterController] Results:', { 
      successful: results.successful.length, 
      failed: results.failed.length 
    });

    // Create campaign record
    const campaign = new EmailCampaign({
      title,
      message,
      recipients: [
        ...results.successful,
        ...results.failed
      ],
      totalRecipients: recipientEmails.length,
      successCount: results.successful.length,
      failureCount: results.failed.length,
      sentBy: adminEmail,
      status: results.failed.length === 0 ? 'completed' : 
              results.successful.length === 0 ? 'failed' : 'partial'
    });

    await campaign.save();
    console.log('[NewsletterController] Campaign saved to database');

    res.status(200).json({ 
      success: true,
      message: 'Campaign sent successfully',
      campaign: {
        id: campaign._id,
        title: campaign.title,
        totalRecipients: campaign.totalRecipients,
        successCount: campaign.successCount,
        failureCount: campaign.failureCount,
        status: campaign.status
      }
    });
  } catch (error) {
    console.error('[NewsletterController] Campaign send error:', error);
    res.status(500).json({ message: 'Failed to send campaign', error: error.message });
  }
};

// Get campaign history (Admin only)
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find()
      .sort({ sentAt: -1 })
      .select('-recipients'); // Exclude detailed recipient info for performance

    res.status(200).json({ 
      success: true,
      count: campaigns.length,
      campaigns 
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Failed to fetch campaigns', error: error.message });
  }
};

// Get single campaign details (Admin only)
exports.getCampaignDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await EmailCampaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json({ 
      success: true,
      campaign 
    });
  } catch (error) {
    console.error('Get campaign details error:', error);
    res.status(500).json({ message: 'Failed to fetch campaign details', error: error.message });
  }
};

// Unsubscribe (Admin only - for management)
exports.unsubscribe = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Newsletter.findById(id);

    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    subscriber.isActive = false;
    await subscriber.save();

    res.status(200).json({ 
      success: true,
      message: 'Subscriber removed successfully' 
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ message: 'Failed to unsubscribe', error: error.message });
  }
};
