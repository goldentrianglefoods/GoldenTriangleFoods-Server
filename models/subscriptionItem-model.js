const mongoose = require("mongoose");

// SubscriptionItem Schema - Links food items to subscription page display
const SubscriptionItemSchema = new mongoose.Schema({
    foodItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodItem',
        required: true,
        unique: true // Each food item can only be added once
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for fast sorting
SubscriptionItemSchema.index({ sortOrder: 1 });

const SubscriptionItem = mongoose.model('SubscriptionItem', SubscriptionItemSchema);
module.exports = SubscriptionItem;
