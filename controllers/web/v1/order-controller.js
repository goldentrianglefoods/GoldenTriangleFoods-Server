const Order = require('../../../models/order-model');
const Payment = require('../../../models/payment-model');
const Cart = require('../../../models/cart-model');
const FoodItem = require('../../../models/foodItem-model');
const Address = require('../../../models/address-model');
const { razorpayInstance, verifyPaymentSignature } = require('../../../utils/razorpay');
const { calculateDeliveryFee } = require('../../../utils/delivery-fee');
const { forwardGeocodeAddress } = require('../../../utils/geocode');

/**
 * Initiate Order - Create pending order from cart
 * POST /order/initiate
 */
const initiateOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressId, isScheduled, scheduledDate, scheduledTimeSlot } = req.body;

        if (!addressId) {
            return res.status(400).json({
                status: false,
                message: "Address ID is required"
            });
        }

        // Validate schedule delivery fields
        if (isScheduled) {
            if (!scheduledDate || !scheduledTimeSlot) {
                return res.status(400).json({
                    status: false,
                    message: "Scheduled date and time slot are required for scheduled delivery"
                });
            }
            // Validate that the scheduled date is in the future
            const schedDate = new Date(scheduledDate);
            const now = new Date();
            if (schedDate < now) {
                return res.status(400).json({
                    status: false,
                    message: "Scheduled date must be in the future"
                });
            }
        }

        // Get user's cart with foodItem populated
        const cart = await Cart.findOne({ user: userId }).populate('items.foodItem');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Cart is empty"
            });
        }

        // Prepare order items from cart
        const orderItems = cart.items.map(item => ({
            foodItem: item.foodItem._id,
            quantity: item.quantity,
            customization: item.customization || {},
            price: item.priceSnapshot,
            addOnsTotal: item.addOnsTotal || 0,
            originalPrice: item.foodItem.originalPrice || item.priceSnapshot,
            subTotal: (item.priceSnapshot + (item.addOnsTotal || 0)) * item.quantity
        }));

        // Calculate totals
        const subtotal = orderItems.reduce((sum, item) => sum + item.subTotal, 0);
        const totalMrp = orderItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
        const discountAmount = totalMrp - subtotal;

        // Validate address and calculate delivery fee by distance
        const address = await Address.findOne({ _id: addressId, userId });
        if (!address) {
            return res.status(400).json({
                status: false,
                message: "Invalid address selected"
            });
        }

        if (address.latitude == null || address.longitude == null) {
            try {
                const coords = await forwardGeocodeAddress(address);
                address.latitude = coords.lat;
                address.longitude = coords.lng;
                await address.save();
            } catch (error) {
                // keep nulls, fallback in delivery fee util
            }
        }

        const deliveryFee = await calculateDeliveryFee(address.latitude, address.longitude, subtotal);
        const totalAmount = subtotal + deliveryFee;

        // Calculate expected delivery time
        let expectedDeliveryDate;
        if (isScheduled && scheduledDate) {
            // For scheduled orders, use the scheduled date
            expectedDeliveryDate = new Date(scheduledDate);
        } else {
            // For instant orders, default: 45 min from now
            expectedDeliveryDate = new Date();
            expectedDeliveryDate.setMinutes(expectedDeliveryDate.getMinutes() + 45);
        }

        // Create pending order
        const order = new Order({
            user: userId,
            orderItems,
            shippingAddress: addressId,
            billingAddress: addressId,
            totalAmount,
            discountAmount,
            deliveryFee,
            expectedDeliveryDate,
            isScheduled: isScheduled || false,
            scheduledDate: isScheduled ? new Date(scheduledDate) : null,
            scheduledTimeSlot: isScheduled ? scheduledTimeSlot : null,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await order.save();

        res.status(201).json({
            status: true,
            message: "Order initiated successfully",
            order: {
                orderId: order._id,
                amount: totalAmount,
                discountAmount,
                totalMrp
            }
        });

    } catch (error) {
        console.error("Error initiating order:", error);
        res.status(500).json({
            status: false,
            message: "Failed to initiate order",
            error: error.message
        });
    }
};

/**
 * Create Razorpay Order
 * POST /order/create-razorpay-order
 */
const createRazorpayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                status: false,
                message: "Order ID is required"
            });
        }

        // Find the order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                status: false,
                message: "Order not found"
            });
        }

        // Check if order belongs to user
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: false,
                message: "Unauthorized access to order"
            });
        }

        // Create Razorpay order
        const razorpayOrder = await razorpayInstance.orders.create({
            amount: Math.round(order.totalAmount * 100), // Amount in paise
            currency: "INR",
            receipt: `order_${orderId}`,
            notes: {
                orderId: orderId.toString(),
                userId: req.user._id.toString()
            }
        });

        // Update order with Razorpay order ID
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.status(200).json({
            status: true,
            message: "Razorpay order created successfully",
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            },
            orderId: order._id,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({
            status: false,
            message: "Failed to create Razorpay order",
            error: error.message
        });
    }
};

/**
 * Verify Payment and Complete Order
 * POST /order/verify-and-complete
 */
const verifyAndCompleteOrder = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId
        } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
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

        // Find and update order
        const order = await Order.findById(orderId)
            .populate('orderItems.foodItem')
            .populate('shippingAddress')
            .populate('billingAddress');

        if (!order) {
            return res.status(404).json({
                status: false,
                message: "Order not found"
            });
        }

        // Create Payment record
        const payment = new Payment({
            userId: req.user._id,
            orderId: order._id,
            method: 'razorpay',
            amount: order.totalAmount,
            status: 'paid',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paidAt: new Date()
        });

        await payment.save();

        // Update order
        order.paymentStatus = 'paid';
        order.status = 'order_placed';
        order.paymentId = payment._id;
        await order.save();

        // Clear user's cart
        await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $set: { items: [], total: 0 } }
        );

        // Prepare response with full order details
        const orderDetails = {
            orderId: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            discountAmount: order.discountAmount,
            placedAt: order.placedAt,
            items: order.orderItems.map(item => ({
                foodItemId: item.foodItem._id,
                name: item.foodItem.name,
                image: item.foodItem.image || '',
                quantity: item.quantity,
                customization: item.customization,
                price: item.price,
                addOnsTotal: item.addOnsTotal,
                subTotal: item.subTotal
            })),
            shippingAddress: order.shippingAddress,
            deliveryFee: order.deliveryFee || 0,
            expectedDeliveryDate: order.expectedDeliveryDate,
            payment: {
                paymentId: payment._id,
                method: payment.method,
                amount: payment.amount,
                status: payment.status,
                razorpayPaymentId: payment.razorpayPaymentId,
                paidAt: payment.paidAt
            }
        };

        res.status(200).json({
            status: true,
            message: "Payment verified and order completed successfully",
            order: orderDetails
        });

    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({
            status: false,
            message: "Failed to verify payment",
            error: error.message
        });
    }
};

/**
 * Place COD Order
 * POST /order/cod
 */
const placeCodOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                status: false,
                message: "Order ID is required"
            });
        }

        // Find order
        const order = await Order.findById(orderId)
            .populate('orderItems.foodItem')
            .populate('shippingAddress')
            .populate('billingAddress');

        if (!order) {
            return res.status(404).json({
                status: false,
                message: "Order not found"
            });
        }

        // Check authorization
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: false,
                message: "Unauthorized access to order"
            });
        }

        // Create Payment record for COD
        const payment = new Payment({
            userId: req.user._id,
            orderId: order._id,
            method: 'cod',
            amount: order.totalAmount,
            status: 'pending'
        });

        await payment.save();

        // Update order
        order.status = 'order_placed';
        order.paymentStatus = 'pending'; // COD - payment pending until delivery
        order.paymentId = payment._id;
        await order.save();

        // Clear user's cart
        await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $set: { items: [], total: 0 } }
        );

        // Prepare response
        const orderDetails = {
            orderId: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            discountAmount: order.discountAmount,
            placedAt: order.placedAt,
            items: order.orderItems.map(item => ({
                foodItemId: item.foodItem._id,
                name: item.foodItem.name,
                image: item.foodItem.image || '',
                quantity: item.quantity,
                customization: item.customization,
                price: item.price,
                addOnsTotal: item.addOnsTotal,
                subTotal: item.subTotal
            })),
            shippingAddress: order.shippingAddress,
            deliveryFee: order.deliveryFee || 0,
            expectedDeliveryDate: order.expectedDeliveryDate,
            payment: {
                paymentId: payment._id,
                method: payment.method,
                amount: payment.amount,
                status: payment.status
            }
        };

        res.status(200).json({
            status: true,
            message: "COD order placed successfully",
            order: orderDetails
        });

    } catch (error) {
        console.error("Error placing COD order:", error);
        res.status(500).json({
            status: false,
            message: "Failed to place COD order",
            error: error.message
        });
    }
};

/**
 * Get User's Orders
 * GET /order/my-orders
 */
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const orders = await Order.find({ user: userId, isDeleted: false })
            .populate('orderItems.foodItem', 'name image price')
            .populate('shippingAddress')
            .populate('paymentId', 'method status razorpayPaymentId paidAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalOrders = await Order.countDocuments({ user: userId, isDeleted: false });

        res.status(200).json({
            status: true,
            orders: orders.map(order => ({
                orderId: order._id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                totalAmount: order.totalAmount,
                discountAmount: order.discountAmount,
                placedAt: order.placedAt,
                createdAt: order.createdAt,
                items: order.orderItems.map(item => ({
                    foodItemId: item.foodItem?._id,
                    name: item.foodItem?.name,
                    image: item.foodItem?.image || '',
                    quantity: item.quantity,
                    customization: item.customization,
                    price: item.price,
                    subTotal: item.subTotal
                })),
                shippingAddress: order.shippingAddress,
                payment: order.paymentId
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders
            }
        });

    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

/**
 * Get Single Order Details
 * GET /order/:orderId
 */
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId, isDeleted: false })
            .populate('orderItems.foodItem', 'name image price originalPrice isVeg nutrition')
            .populate('shippingAddress')
            .populate('billingAddress')
            .populate('paymentId');

        if (!order) {
            return res.status(404).json({
                status: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            status: true,
            order: {
                orderId: order._id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                totalAmount: order.totalAmount,
                discountAmount: order.discountAmount,
                deliveryFee: order.deliveryFee,
                placedAt: order.placedAt,
                createdAt: order.createdAt,
                items: order.orderItems.map(item => ({
                    foodItemId: item.foodItem?._id,
                    name: item.foodItem?.name,
                    image: item.foodItem?.image || '',
                    isVeg: item.foodItem?.isVeg,
                    quantity: item.quantity,
                    customization: item.customization,
                    price: item.price,
                    addOnsTotal: item.addOnsTotal,
                    originalPrice: item.originalPrice,
                    subTotal: item.subTotal
                })),
                shippingAddress: order.shippingAddress,
                billingAddress: order.billingAddress,
                expectedDeliveryDate: order.expectedDeliveryDate,
                payment: order.paymentId
            }
        });

    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch order",
            error: error.message
        });
    }
};

module.exports = {
    initiateOrder,
    createRazorpayOrder,
    verifyAndCompleteOrder,
    placeCodOrder,
    getUserOrders,
    getOrderById
};
