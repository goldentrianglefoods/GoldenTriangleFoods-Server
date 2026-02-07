const mongoose = require("mongoose");

// Customization sub-schema for salad preferences
const saladCustomizationSchema = new mongoose.Schema({
    selectedVeggies: [{ type: String }],
    selectedProteins: [{
        name: { type: String },
        price: { type: Number, default: 0 }
    }],
    removedIngredients: [{ type: String }],
    specialInstructions: { type: String, default: "" }
}, { _id: false });

// Delivery details sub-schema
const deliveryDetailsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
    deliveryTime: { type: String, required: true }
}, { _id: false });

// Delivery schedule sub-schema
const deliveryScheduleSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    address: { type: String, default: null },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
    addressLat: { type: Number, default: null },
    addressLng: { type: Number, default: null },
    status: {
        type: String,
        enum: ['scheduled', 'delivered', 'skipped', 'rescheduled'],
        default: 'scheduled'
    },
    updatedAt: { type: Date, default: Date.now }
});

// Subscription Status Options
const SubscriptionStatusEnum = [
    'pending',       // Payment pending
    'active',        // Subscription is active
    'paused',        // Temporarily paused
    'completed',     // All deliveries completed
    'cancelled',     // Subscription cancelled
    'refunded'       // Refund processed
];

const SubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Reference to the subscription plan
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true
    },

    // Snapshot of plan details at purchase time
    planSnapshot: {
        name: { type: String, required: true },
        days: { type: Number, required: true },
        validityDays: { type: Number, required: true },
        skipDays: { type: Number, default: 2 },
        price: { type: Number, required: true },
        discount: { type: Number, default: 0 }
    },

    // Selected salad
    salad: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodItem',
        required: true
    },

    // Salad snapshot at purchase time
    saladSnapshot: {
        name: { type: String },
        image: { type: String },
        price: { type: Number }
    },

    // Salad customization
    customization: saladCustomizationSchema,

    // Delivery details from form
    deliveryDetails: deliveryDetailsSchema,

    // Delivery schedule (selected dates)
    deliverySchedule: [deliveryScheduleSchema],

    // Pricing
    basePrice: { type: Number, required: true },
    proteinAddOnsCost: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // Payment fields
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    paidAt: { type: Date, default: null },

    // Subscription status
    status: {
        type: String,
        enum: SubscriptionStatusEnum,
        default: 'pending'
    },

    // Subscription dates
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    // Tracking deliveries
    deliveriesCompleted: { type: Number, default: 0 },
    skipsUsed: { type: Number, default: 0 },

    // Admin notes
    adminNotes: { type: String, default: "" }

}, { timestamps: true });

// Index for finding active subscription per user
SubscriptionSchema.index({ user: 1, status: 1 });

// Virtual for remaining deliveries
SubscriptionSchema.virtual('remainingDeliveries').get(function () {
    return this.planSnapshot.days - this.deliveriesCompleted;
});

// Virtual for remaining skips
SubscriptionSchema.virtual('remainingSkips').get(function () {
    return this.planSnapshot.skipDays - this.skipsUsed;
});

SubscriptionSchema.set('toJSON', { virtuals: true });
SubscriptionSchema.set('toObject', { virtuals: true });

const Subscription = mongoose.model('Subscription', SubscriptionSchema);
module.exports = Subscription;
