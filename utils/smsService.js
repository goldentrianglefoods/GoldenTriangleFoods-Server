const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;

// Create Twilio client only if credentials are available
const getTwilioClient = () => {
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('[SMS Service] Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
    return null;
  }

  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
    console.log('[SMS Service] Twilio client initialized successfully');
  }

  return twilioClient;
};

/**
 * Send OTP via SMS to Indian phone number
 * @param {string} phoneNumber - Phone number in format +91XXXXXXXXXX
 * @param {string} otp - 6-digit OTP code
 * @param {string} userName - User's name for personalization
 * @returns {Promise<Object>} - Twilio message response
 */
const sendOtpSms = async (phoneNumber, otp, userName = 'User') => {
  try {
    const client = getTwilioClient();
    
    if (!client) {
      throw new Error('Twilio client not initialized. Check your environment variables.');
    }

    // Validate phone number format
    if (!/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
      throw new Error('Invalid Indian phone number format. Must be +91XXXXXXXXXX');
    }

    // Create SMS message body
    const messageBody = `Hello ${userName},\n\nYour OTP for Golden Triangle Foods is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this message.\n\n- Golden Triangle Foods Team`;

    console.log(`[SMS Service] Sending OTP to ${phoneNumber}`);

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log(`[SMS Service] SMS sent successfully. SID: ${message.sid}, Status: ${message.status}`);

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
      to: phoneNumber
    };

  } catch (error) {
    console.error('[SMS Service] Error sending SMS:', error.message);
    
    // Handle specific Twilio errors
    if (error.code === 21211) {
      throw new Error('Invalid phone number');
    } else if (error.code === 21608) {
      throw new Error('Phone number is not verified. In Twilio trial mode, verify this number first.');
    } else if (error.code === 21614) {
      throw new Error('Invalid phone number format');
    }
    
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send password reset OTP via SMS
 * @param {string} phoneNumber - Phone number in format +91XXXXXXXXXX
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>} - Twilio message response
 */
const sendPasswordResetSms = async (phoneNumber, otp) => {
  try {
    const client = getTwilioClient();
    
    if (!client) {
      throw new Error('Twilio client not initialized. Check your environment variables.');
    }

    // Validate phone number format
    if (!/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
      throw new Error('Invalid Indian phone number format. Must be +91XXXXXXXXXX');
    }

    // Create SMS message body for password reset
    const messageBody = `Your password reset OTP for Golden Triangle Foods is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this, please secure your account immediately.\n\n- Golden Triangle Foods Team`;

    console.log(`[SMS Service] Sending password reset OTP to ${phoneNumber}`);

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log(`[SMS Service] Password reset SMS sent successfully. SID: ${message.sid}`);

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
      to: phoneNumber
    };

  } catch (error) {
    console.error('[SMS Service] Error sending password reset SMS:', error.message);
    throw new Error(`Failed to send password reset SMS: ${error.message}`);
  }
};

/**
 * Format phone number to E.164 format for India (+91)
 * @param {string} phoneNumber - Phone number (with or without +91)
 * @returns {string} - Formatted phone number +91XXXXXXXXXX
 */
const formatIndianPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If starts with 91, add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // If 10 digits, add +91
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  
  // If already has +91
  if (phoneNumber.startsWith('+91') && phoneNumber.length === 13) {
    return phoneNumber;
  }
  
  throw new Error('Invalid phone number format');
};

module.exports = {
  sendOtpSms,
  sendPasswordResetSms,
  formatIndianPhoneNumber
};
