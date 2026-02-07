const Subscription = require('../../../models/subscription-model');
const SubscriptionPlan = require('../../../models/subscriptionPlan-model');
const { FoodItem } = require('../../../models/foodItem-model');
const Payment = require('../../../models/payment-model');
const Address = require('../../../models/address-model');
const { razorpayInstance, verifyPaymentSignature } = require('../../../utils/razorpay');

const normalizeDate = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Get All Active Subscription Plans
 * GET /subscription/plans
 */
const getSubscriptionPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true })
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
 * Create Subscription - Initiate subscription with Razorpay order
 * POST /subscription/create
 */
const createSubscription = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            planId,
            saladId,
            customization,
            deliveryDetails,
            selectedDates
        } = req.body;

        // Validate required fields
        if (!planId || !saladId || !deliveryDetails || !Array.isArray(selectedDates)) {
            return res.status(400).json({
                status: false,
                message: "Plan ID, Salad ID, delivery details, and selected dates are required"
            });
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findOne({
            user: userId,
            status: { $in: ['pending', 'active'] }
        });

        if (existingSubscription) {
            return res.status(400).json({
                status: false,
                message: "You already have an active subscription. Please complete or cancel it before starting a new one."
            });
        }

        // Get subscription plan
        const plan = await SubscriptionPlan.findById(planId);
        if (!plan || !plan.isActive) {
            return res.status(404).json({
                status: false,
                message: "Subscription plan not found or inactive"
            });
        }

        // Validate selected dates count
        if (selectedDates.length !== plan.days) {
            return res.status(400).json({
                status: false,
                message: `Please select exactly ${plan.days} delivery dates`
            });
        }

        const tomorrow = normalizeDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
        const validityEnd = normalizeDate(new Date(tomorrow));
        validityEnd.setDate(validityEnd.getDate() + plan.validityDays - 1);

        const normalizedDates = selectedDates.map((d) => normalizeDate(d));
        const uniqueDates = new Set(normalizedDates.map((d) => d.getTime()));
        if (uniqueDates.size !== normalizedDates.length) {
            return res.status(400).json({
                status: false,
                message: "Duplicate dates are not allowed"
            });
        }

        const outOfRange = normalizedDates.some((d) => d < tomorrow || d > validityEnd);
        if (outOfRange) {
            return res.status(400).json({
                status: false,
                message: "Selected dates must be within the validity period"
            });
        }

        // Get salad
        const salad = await FoodItem.findById(saladId);
        if (!salad) {
            return res.status(404).json({
                status: false,
                message: "Selected salad not found"
            });
        }

        // Resolve address from addressId if provided
        let resolvedAddress = deliveryDetails.address;
        let addressId = deliveryDetails.addressId || null;
        let addressLat = null;
        let addressLng = null;
        if (addressId) {
            const address = await Address.findOne({ _id: addressId, userId: userId });
            if (!address) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid address selected"
                });
            }
            const building = address.building ? `${address.building}, ` : "";
            const landmark = address.landmark ? `, ${address.landmark}` : "";
            resolvedAddress = `${address.houseNumber}, ${building}${address.street}, ${address.city}, ${address.state} - ${address.pincode}${landmark}`;
            addressLat = address.latitude ?? null;
            addressLng = address.longitude ?? null;
        }

        // Calculate protein add-ons cost
        let proteinAddOnsCost = 0;
        if (customization?.selectedProteins && customization.selectedProteins.length > 0) {
            proteinAddOnsCost = customization.selectedProteins.reduce(
                (sum, protein) => sum + (protein.price || 0), 0
            );
        }

        // Total = Plan price + (protein add-ons * number of days)
        const totalAmount = plan.price + (proteinAddOnsCost * plan.days);

        // Create delivery schedule
        const schedule = normalizedDates
            .sort((a, b) => a.getTime() - b.getTime())
            .map((date) => ({
                date,
                timeSlot: deliveryDetails.deliveryTime,
                address: resolvedAddress,
                addressId: addressId || null,
                addressLat,
                addressLng,
                status: 'scheduled'
            }));

        // Create subscription
        const subscription = new Subscription({
            user: userId,
            plan: plan._id,
            planSnapshot: {
                name: plan.name,
                days: plan.days,
                validityDays: plan.validityDays,
                skipDays: plan.skipDays,
                price: plan.price,
                discount: plan.discount
            },
            salad: salad._id,
            saladSnapshot: {
                name: salad.name,
                image: salad.image,
                price: salad.price
            },
            customization: customization || {},
            deliveryDetails: {
                name: deliveryDetails.name,
                phone: deliveryDetails.phone,
                address: resolvedAddress,
                addressId: addressId || null,
                deliveryTime: deliveryDetails.deliveryTime
            },
            deliverySchedule: schedule,
            basePrice: plan.price,
            proteinAddOnsCost,
            totalAmount,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await subscription.save();

        // Create Razorpay order
        const razorpayOrder = await razorpayInstance.orders.create({
            amount: Math.round(totalAmount * 100), // Amount in paise
            currency: "INR",
            receipt: `sub_${subscription._id}`,
            notes: {
                subscriptionId: subscription._id.toString(),
                userId: userId.toString(),
                planName: plan.name
            }
        });

        // Update subscription with Razorpay order ID
        subscription.razorpayOrderId = razorpayOrder.id;
        await subscription.save();

        res.status(201).json({
            status: true,
            message: "Subscription created successfully",
            subscription: {
                id: subscription._id,
                planName: plan.name,
                totalAmount,
                proteinAddOnsCost
            },
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            },
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Error creating subscription:", error);
        res.status(500).json({
            status: false,
            message: "Failed to create subscription",
            error: error.message
        });
    }
};

/**
 * Verify Subscription Payment
 * POST /subscription/verify-payment
 */
const verifySubscriptionPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            subscriptionId
        } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !subscriptionId) {
            return res.status(400).json({
                status: false,
                message: "Missing required payment verification fields"
            });
        }

        // Verify signature
        const isValidSignature = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValidSignature) {
            return res.status(400).json({
                status: false,
                message: "Payment verification failed - Invalid signature"
            });
        }

        // Find subscription
        const subscription = await Subscription.findById(subscriptionId)
            .populate('plan')
            .populate('salad');

        if (!subscription) {
            return res.status(404).json({
                status: false,
                message: "Subscription not found"
            });
        }

        // Check ownership
        if (subscription.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: false,
                message: "Unauthorized access to subscription"
            });
        }

        // Create Payment record
        const payment = new Payment({
            userId: req.user._id,
            orderId: subscription._id,
            method: 'razorpay',
            amount: subscription.totalAmount,
            status: 'paid',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paidAt: new Date()
        });

        await payment.save();

        // Calculate start and end dates
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1); // Start from tomorrow

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + subscription.planSnapshot.validityDays - 1);

        // Update subscription
        subscription.paymentStatus = 'paid';
        subscription.status = 'active';
        subscription.razorpayPaymentId = razorpay_payment_id;
        subscription.razorpaySignature = razorpay_signature;
        subscription.paidAt = new Date();
        subscription.startDate = startDate;
        subscription.endDate = endDate;

        await subscription.save();

        res.status(200).json({
            status: true,
            message: "Payment verified and subscription activated successfully",
            subscription: {
                id: subscription._id,
                planName: subscription.planSnapshot.name,
                status: subscription.status,
                totalAmount: subscription.totalAmount,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                days: subscription.planSnapshot.days,
                saladName: subscription.saladSnapshot.name
            }
        });

    } catch (error) {
        console.error("Error verifying subscription payment:", error);
        res.status(500).json({
            status: false,
            message: "Failed to verify payment",
            error: error.message
        });
    }
};

/**
 * Get User's Subscriptions
 * GET /subscription/my-subscriptions
 */
const getMySubscriptions = async (req, res) => {
    try {
        const userId = req.user._id;

        const subscriptions = await Subscription.find({ user: userId })
            .populate('plan')
            .populate('salad', 'name image price isVeg')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: true,
            subscriptions: subscriptions.map(sub => ({
                id: sub._id,
                planName: sub.planSnapshot.name,
                planDays: sub.planSnapshot.days,
                salad: {
                    name: sub.saladSnapshot.name,
                    image: sub.saladSnapshot.image
                },
                customization: sub.customization,
                deliveryDetails: sub.deliveryDetails,
                totalAmount: sub.totalAmount,
                status: sub.status,
                paymentStatus: sub.paymentStatus,
                startDate: sub.startDate,
                endDate: sub.endDate,
                deliverySchedule: sub.deliverySchedule,
                deliveriesCompleted: sub.deliveriesCompleted,
                remainingDeliveries: sub.planSnapshot.days - sub.deliveriesCompleted,
                skipsUsed: sub.skipsUsed,
                remainingSkips: sub.planSnapshot.skipDays - sub.skipsUsed,
                createdAt: sub.createdAt
            }))
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
 * Get Single Subscription Details
 * GET /subscription/:id
 */
const getSubscriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const subscription = await Subscription.findOne({ _id: id, user: userId })
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
            subscription: {
                id: subscription._id,
                plan: subscription.planSnapshot,
                salad: subscription.saladSnapshot,
                customization: subscription.customization,
                deliveryDetails: subscription.deliveryDetails,
                deliverySchedule: subscription.deliverySchedule,
                totalAmount: subscription.totalAmount,
                proteinAddOnsCost: subscription.proteinAddOnsCost,
                status: subscription.status,
                paymentStatus: subscription.paymentStatus,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                deliveriesCompleted: subscription.deliveriesCompleted,
                skipsUsed: subscription.skipsUsed,
                adminNotes: subscription.adminNotes,
                createdAt: subscription.createdAt
            }
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
 * Update Subscription Schedule (User)
 * PATCH /subscription/:id/schedule/:scheduleId
 */
const updateSubscriptionSchedule = async (req, res) => {
    try {
        const { id, scheduleId } = req.params;
        const { newDate, newTime, newAddressId } = req.body;
        const userId = req.user._id;

        const subscription = await Subscription.findOne({ _id: id, user: userId });
        if (!subscription) {
            return res.status(404).json({
                status: false,
                message: "Subscription not found"
            });
        }

        if (subscription.status !== 'active') {
            return res.status(400).json({
                status: false,
                message: "Only active subscriptions can be modified"
            });
        }

        const scheduleItem = subscription.deliverySchedule.id(scheduleId);
        if (!scheduleItem) {
            return res.status(404).json({
                status: false,
                message: "Schedule item not found"
            });
        }

        const now = new Date();
        const cutoff = new Date(scheduleItem.date);
        cutoff.setHours(cutoff.getHours() - 24);
        if (now >= cutoff) {
            return res.status(400).json({
                status: false,
                message: "Schedule can only be changed at least 24 hours in advance"
            });
        }

        if (newDate) {
            const normalized = normalizeDate(newDate);
            const startDate = subscription.startDate ? normalizeDate(subscription.startDate) : normalizeDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
            const endDate = subscription.endDate ? normalizeDate(subscription.endDate) : normalizeDate(new Date(startDate));
            if (!subscription.endDate) {
                endDate.setDate(endDate.getDate() + subscription.planSnapshot.validityDays - 1);
            }

            if (normalized < startDate || normalized > endDate) {
                return res.status(400).json({
                    status: false,
                    message: "New date is outside the subscription validity period"
                });
            }

            const exists = subscription.deliverySchedule.some((item) =>
                item._id.toString() !== scheduleId &&
                normalizeDate(item.date).getTime() === normalized.getTime()
            );
            if (exists) {
                return res.status(400).json({
                    status: false,
                    message: "This date is already selected"
                });
            }

            if (normalizeDate(scheduleItem.date).getTime() !== normalized.getTime()) {
                scheduleItem.status = 'rescheduled';
            }
            scheduleItem.date = normalized;
        }

        if (newTime) {
            scheduleItem.timeSlot = newTime;
        }

        if (newAddressId) {
            const address = await Address.findOne({ _id: newAddressId, userId: userId });
            if (!address) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid address selected"
                });
            }
            const building = address.building ? `${address.building}, ` : "";
            const landmark = address.landmark ? `, ${address.landmark}` : "";
            const resolvedAddress = `${address.houseNumber}, ${building}${address.street}, ${address.city}, ${address.state} - ${address.pincode}${landmark}`;
            scheduleItem.address = resolvedAddress;
            scheduleItem.addressId = address._id;
            scheduleItem.addressLat = address.latitude ?? null;
            scheduleItem.addressLng = address.longitude ?? null;
        }

        scheduleItem.updatedAt = new Date();

        await subscription.save();

        res.status(200).json({
            status: true,
            message: "Schedule updated successfully",
            deliverySchedule: subscription.deliverySchedule
        });

    } catch (error) {
        console.error("Error updating schedule:", error);
        res.status(500).json({
            status: false,
            message: "Failed to update schedule",
            error: error.message
        });
    }
};

/**
 * Get Active Subscription (for checking if user has one)
 * GET /subscription/active
 */
const getActiveSubscription = async (req, res) => {
    try {
        const userId = req.user._id;

        const subscription = await Subscription.findOne({
            user: userId,
            status: { $in: ['active', 'pending'] }
        }).populate('salad', 'name image');

        res.status(200).json({
            status: true,
            hasActive: !!subscription,
            subscription: subscription ? {
                id: subscription._id,
                planName: subscription.planSnapshot.name,
                status: subscription.status,
                saladName: subscription.saladSnapshot.name
            } : null
        });

    } catch (error) {
        console.error("Error checking active subscription:", error);
        res.status(500).json({
            status: false,
            message: "Failed to check subscription status",
            error: error.message
        });
    }
};

module.exports = {
    getSubscriptionPlans,
    createSubscription,
    verifySubscriptionPayment,
    getMySubscriptions,
    getSubscriptionById,
    getActiveSubscription,
    updateSubscriptionSchedule
};
