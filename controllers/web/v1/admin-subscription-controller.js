const SubscriptionPlan = require('../../../models/subscriptionPlan-model');
const Subscription = require('../../../models/subscription-model');

// ========================
// SUBSCRIPTION PLAN CRUD
// ========================

/**
 * Create Subscription Plan
 * POST /admin/subscription/plan
 */
const createPlan = async (req, res) => {
    try {
        const {
            name,
            days,
            validityDays,
            skipDays,
            mrp,
            price,
            discount,
            tagline,
            bestFor,
            features,
            isPopular,
            isBestValue,
            sortOrder
        } = req.body;

        // Validate required fields
        if (!name || !days || !validityDays || !mrp || !price) {
            return res.status(400).json({
                status: false,
                message: "Name, days, validityDays, MRP, and price are required"
            });
        }

        const plan = new SubscriptionPlan({
            name,
            days,
            validityDays,
            skipDays: skipDays || 2,
            mrp,
            price,
            discount: discount || Math.round(((mrp - price) / mrp) * 100),
            tagline: tagline || "",
            bestFor: bestFor || "",
            features: features || [],
            isPopular: isPopular || false,
            isBestValue: isBestValue || false,
            sortOrder: sortOrder || 0,
            isActive: true
        });

        await plan.save();

        res.status(201).json({
            status: true,
            message: "Subscription plan created successfully",
            plan
        });

    } catch (error) {
        console.error("Error creating subscription plan:", error);
        res.status(500).json({
            status: false,
            message: "Failed to create subscription plan",
            error: error.message
        });
    }
};

/**
 * Get All Subscription Plans (Admin)
 * GET /admin/subscription/plans
 */
const getAllPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find()
            .sort({ sortOrder: 1, days: 1 });

        res.status(200).json({
            status: true,
            plans
        });
    } catch (error) {
        console.error("Error fetching subscription plans:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch subscription plans",
            error: error.message
        });
    }
};

/**
 * Get Single Plan
 * GET /admin/subscription/plan/:id
 */
const getPlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await SubscriptionPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                status: false,
                message: "Subscription plan not found"
            });
        }

        res.status(200).json({
            status: true,
            plan
        });
    } catch (error) {
        console.error("Error fetching subscription plan:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch subscription plan",
            error: error.message
        });
    }
};

/**
 * Update Subscription Plan
 * PUT /admin/subscription/plan/:id
 */
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Recalculate discount if MRP or price changed
        if (updateData.mrp && updateData.price) {
            updateData.discount = Math.round(((updateData.mrp - updateData.price) / updateData.mrp) * 100);
        }

        const plan = await SubscriptionPlan.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!plan) {
            return res.status(404).json({
                status: false,
                message: "Subscription plan not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Subscription plan updated successfully",
            plan
        });

    } catch (error) {
        console.error("Error updating subscription plan:", error);
        res.status(500).json({
            status: false,
            message: "Failed to update subscription plan",
            error: error.message
        });
    }
};

/**
 * Delete Subscription Plan (hard delete - permanent removal)
 * DELETE /admin/subscription/plan/:id
 */
const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        const plan = await SubscriptionPlan.findByIdAndDelete(id);

        if (!plan) {
            return res.status(404).json({
                status: false,
                message: "Subscription plan not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Subscription plan deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting subscription plan:", error);
        res.status(500).json({
            status: false,
            message: "Failed to delete subscription plan",
            error: error.message
        });
    }
};

// ========================
// USER SUBSCRIPTIONS MANAGEMENT
// ========================

/**
 * Get All User Subscriptions
 * GET /admin/subscription/orders
 */
const getAllSubscriptions = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const subscriptions = await Subscription.find(query)
            .populate('user', 'name email phone')
            .populate('plan', 'name days')
            .populate('salad', 'name image')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Subscription.countDocuments(query);

        res.status(200).json({
            status: true,
            subscriptions: subscriptions.map(sub => ({
                id: sub._id,
                user: sub.user,
                planName: sub.planSnapshot.name,
                planDays: sub.planSnapshot.days,
                salad: sub.saladSnapshot,
                customization: sub.customization,
                totalAmount: sub.totalAmount,
                status: sub.status,
                paymentStatus: sub.paymentStatus,
                deliveryDetails: sub.deliveryDetails,
                deliverySchedule: sub.deliverySchedule,
                startDate: sub.startDate,
                endDate: sub.endDate,
                deliveriesCompleted: sub.deliveriesCompleted,
                skipsUsed: sub.skipsUsed,
                createdAt: sub.createdAt
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch subscriptions",
            error: error.message
        });
    }
};

/**
 * Update Subscription Schedule Status (Admin)
 * PUT /admin/subscription/order/:id/schedule/:scheduleId
 */
const updateSubscriptionScheduleStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id, scheduleId } = req.params;

        const allowed = ['scheduled', 'delivered', 'skipped', 'rescheduled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                status: false,
                message: "Invalid status"
            });
        }

        const subscription = await Subscription.findById(id);
        if (!subscription) {
            return res.status(404).json({
                status: false,
                message: "Subscription not found"
            });
        }

        const scheduleItem = subscription.deliverySchedule.id(scheduleId);
        if (!scheduleItem) {
            return res.status(404).json({
                status: false,
                message: "Schedule item not found"
            });
        }

        scheduleItem.status = status;
        scheduleItem.updatedAt = new Date();

        // Recalculate counts
        const deliveredCount = subscription.deliverySchedule.filter(item => item.status === 'delivered').length;
        const skippedCount = subscription.deliverySchedule.filter(item => item.status === 'skipped').length;
        subscription.deliveriesCompleted = deliveredCount;
        subscription.skipsUsed = skippedCount;

        await subscription.save();

        res.status(200).json({
            status: true,
            message: "Schedule status updated",
            deliverySchedule: subscription.deliverySchedule
        });
    } catch (error) {
        console.error("Error updating schedule status:", error);
        res.status(500).json({
            status: false,
            message: "Failed to update schedule status",
            error: error.message
        });
    }
};

/**
 * Get Subscription Details (Admin)
 * GET /admin/subscription/order/:id
 */
const getSubscriptionDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const subscription = await Subscription.findById(id)
            .populate('user', 'name email phone')
            .populate('plan')
            .populate('salad');

        if (!subscription) {
            return res.status(404).json({
                status: false,
                message: "Subscription not found"
            });
        }

        res.status(200).json({
            status: true,
            subscription
        });

    } catch (error) {
        console.error("Error fetching subscription:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch subscription",
            error: error.message
        });
    }
};

/**
 * Update Subscription Status
 * PUT /admin/subscription/order/:id/status
 */
const updateSubscriptionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, deliveriesCompleted, skipsUsed } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
        if (deliveriesCompleted !== undefined) updateData.deliveriesCompleted = deliveriesCompleted;
        if (skipsUsed !== undefined) updateData.skipsUsed = skipsUsed;

        const subscription = await Subscription.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('user', 'name email');

        if (!subscription) {
            return res.status(404).json({
                status: false,
                message: "Subscription not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Subscription updated successfully",
            subscription
        });

    } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({
            status: false,
            message: "Failed to update subscription",
            error: error.message
        });
    }
};

/**
 * Get Subscription Stats (for dashboard)
 * GET /admin/subscription/stats
 */
const getSubscriptionStats = async (req, res) => {
    try {
        const [
            totalSubscriptions,
            activeSubscriptions,
            pendingSubscriptions,
            completedSubscriptions,
            totalRevenue
        ] = await Promise.all([
            Subscription.countDocuments(),
            Subscription.countDocuments({ status: 'active' }),
            Subscription.countDocuments({ status: 'pending' }),
            Subscription.countDocuments({ status: 'completed' }),
            Subscription.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        res.status(200).json({
            status: true,
            stats: {
                totalSubscriptions,
                activeSubscriptions,
                pendingSubscriptions,
                completedSubscriptions,
                totalRevenue: totalRevenue[0]?.total || 0
            }
        });

    } catch (error) {
        console.error("Error fetching subscription stats:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch subscription stats",
            error: error.message
        });
    }
};

module.exports = {
    // Plan CRUD
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    deletePlan,
    // Subscription Management
    getAllSubscriptions,
    getSubscriptionDetails,
    updateSubscriptionStatus,
    updateSubscriptionScheduleStatus,
    getSubscriptionStats
};
