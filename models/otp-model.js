const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, default: null },
  phone: { type: String, default: null },
  type: { type: String, enum: ['email', 'sms'], required: true }, // OTP delivery type
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // expire-> in 5 min
});

// Partial unique indexes - only enforce uniqueness when email/phone actually exists
otpSchema.index(
  { email: 1, type: 1 },
  { 
    unique: true,
    partialFilterExpression: { email: { $type: "string" } }
  }
);

otpSchema.index(
  { phone: 1, type: 1 },
  { 
    unique: true,
    partialFilterExpression: { phone: { $type: "string" } }
  }
);

module.exports = mongoose.model("OTP", otpSchema);
