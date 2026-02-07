const mongoose = require("mongoose");

// SubscriptionPlan Schema - Admin managed subscription plans
const SubscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    days: {
        type: Number,
        required: true,
        min: 1
    },
    validityDays: {
        type: Number,
        required: true,
        min: 1
    },
    skipDays: {
        type: Number,
        default: 2,
        min: 0
    },
    mrp: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    tagline: {
        type: String,
        default: ""
    },
    bestFor: {
        type: String,
        default: ""
    },
    features: [{
        type: String
    }],
    isPopular: {
        type: Boolean,
        default: false
    },
    isBestValue: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Calculate savings virtual
SubscriptionPlanSchema.virtual('savings').get(function () {
    return this.mrp - this.price;
});

// Ensure virtuals are included in JSON
SubscriptionPlanSchema.set('toJSON', { virtuals: true });
SubscriptionPlanSchema.set('toObject', { virtuals: true });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
module.exports = SubscriptionPlan;
