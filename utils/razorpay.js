const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance with credentials
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET'
});

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} - Whether signature is valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
        .update(body.toString())
        .digest('hex');
    
    return expectedSignature === signature;
};

module.exports = {
    razorpayInstance,
    verifyPaymentSignature
};
