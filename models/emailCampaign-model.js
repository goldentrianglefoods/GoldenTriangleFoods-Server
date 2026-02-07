const mongoose = require('mongoose');

const emailCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  recipients: [{
    email: String,
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent'
    }
  }],
  totalRecipients: {
    type: Number,
    required: true
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  sentBy: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'partial', 'failed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);
