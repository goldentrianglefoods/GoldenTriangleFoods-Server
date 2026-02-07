const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },

  method: { 
    type: String, 
    enum: ['card', 'upi', 'netbanking', 'wallet', 'cod', 'razorpay'], 
    required: true 
  },

  amount: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending', 
    index: true 
  },
  
  transactionId: { type: String },

  // Razorpay specific fields
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  razorpaySignature: { type: String, default: null },
  
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },
  
  paidAt: { type: Date }

}, { timestamps: true });

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment