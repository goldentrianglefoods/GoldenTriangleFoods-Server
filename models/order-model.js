const mongoose = require("mongoose");

// Food customization sub-schema (matches cart model)
const foodCustomizationSchema = new mongoose.Schema({
  removedIngredients: [{ type: String }],
  addedOptionals: [{
    name: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  specialInstructions: { type: String, default: "" }
}, { _id: false });

const OrderItemSchema = new mongoose.Schema({
  foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
  quantity: { type: Number, required: true, min: 1 },

  // Food customization (replaces size for food website)
  customization: foodCustomizationSchema,

  price: { type: Number, required: true }, // price at purchase (base price)
  addOnsTotal: { type: Number, default: 0 }, // extra cost from add-ons
  originalPrice: { type: Number, default: 0 }, // original MRP
  subTotal: {
    type: Number,
    default: 0
  }
}, { _id: false });


// Updated Order Status Options
const OrderStatusEnum = [
  'order_placed',    // Order placed successfully
  'processing',      // Being processed/prepared
  'ready',           // Ready for pickup/delivery
  'out_for_delivery', // Out for delivery
  'delivered',       // Successfully delivered
  'cancelled',       // Cancelled
  'refund_initiated', // Refund process started
  'refund_completed', // Refund completed
  'pending'          // Legacy - pending payment
];

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  orderItems: {
    type: [OrderItemSchema],
    required: true
  },

  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true
  },
  billingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true
  },

  totalAmount: { type: Number, required: true },

  discountAmount: { type: Number, default: 0 },

  // Razorpay Integration Fields
  razorpayOrderId: { type: String, default: null },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },

  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },

  status: { type: String, enum: OrderStatusEnum, default: 'pending', index: true },

  // Delivery fee (Free if order >= 499, else 49)
  deliveryFee: {
    type: Number,
    default: 0
  },

  // Prep time in minutes
  prepTime: {
    type: Number,
    default: 30
  },

  // Expected delivery date/time
  expectedDeliveryDate: {
    type: Date,
    default: function () {
      const date = new Date();
      date.setMinutes(date.getMinutes() + 45); // 45 min default
      return date;
    }
  },

  // Actual delivery date (when delivered)
  actualDeliveryDate: {
    type: Date,
    default: null
  },

  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon"
  },

  // Schedule Delivery fields
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  scheduledTimeSlot: {
    type: String,
    default: null
  },

  placedAt: { type: Date, default: Date.now },

  isDeleted: { type: Boolean, default: false }

}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;