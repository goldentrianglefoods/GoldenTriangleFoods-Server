const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,          
    uppercase: true       // ensures all codes are stored in capital letters (e.g., 'SAVE20')
  },

  type: {
    type: String,
    enum: ["percentage", "fixed_amount"], // only allowed values
    required: true
  },

  value: {
    type: Number,
    required: true,       // 10 means 10% if percentage, or ₹10 if fixed_amount
    min: 1
  },

  description: {
    type: String,
    default: ""
  },

  min_purchase_amount: {
    type: Number,
    default: 0
  },

  expiry_date: {
    type: Date,
    required: true
  },

  is_active: {
    type: Boolean,
    default: true
  }

}, { timestamps: true }); 

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
