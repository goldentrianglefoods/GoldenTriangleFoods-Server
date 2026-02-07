const Order = require('../../../models/order-model');
const Payment = require('../../../models/payment-model');

/**
 * Get All Orders (Admin)
 * GET /admin/orders
 */
const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            paymentStatus,
            startDate,
            endDate,
            search
        } = req.query;

        // Build filter
        const filter = { isDeleted: false };

        if (status) {
            filter.status = status;
        }

        if (paymentStatus) {
            filter.paymentStatus = paymentStatus;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Get orders - populate foodItem instead of product
        const orders = await Order.find(filter)
            .populate('user', 'name email phone')
            .populate('orderItems.foodItem', 'name image price isVeg')
            .populate('shippingAddress')
            .populate('paymentId', 'method status razorpayPaymentId paidAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalOrders = await Order.countDocuments(filter);

        // Calculate stats
        const stats = await Order.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: {
                            $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0]
                        }
                    },
                    totalOrders: { $sum: 1 },
                    pendingOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                    },
                    confirmedOrders: {
                        $sum: { $cond: [{ $in: ["$status", ["order_placed", "processing"]] }, 1, 0] }
                    },
                    shippedOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "out_for_delivery"] }, 1, 0] }
                    },
                    deliveredOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
                    }
                }
            }
        ]);

        res.status(200).json({
            status: true,
            orders: orders.map(order => ({
                orderId: order._id,
                user: order.user,
                status: order.status,
                paymentStatus: order.paymentStatus,
                totalAmount: order.totalAmount,
                discountAmount: order.discountAmount,
                itemCount: order.orderItems.length,
                placedAt: order.placedAt,
                createdAt: order.createdAt,
                items: order.orderItems.map(item => ({
                    name: item.foodItem?.name,
                    image: item.foodItem?.image || '',
                    isVeg: item.foodItem?.isVeg,
                    quantity: item.quantity,
                    customization: item.customization,
                    price: item.price,
                    addOnsTotal: item.addOnsTotal,
                    subTotal: item.subTotal
                })),
                shippingAddress: order.shippingAddress,
                payment: order.paymentId,
                isScheduled: order.isScheduled || false,
                scheduledDate: order.scheduledDate,
                scheduledTimeSlot: order.scheduledTimeSlot
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders
            },
            stats: stats[0] || {}
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

/**
 * Get Order Details (Admin)
 * GET /admin/orders/:orderId
 */
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('user', 'name email phone profileUrl')
            .populate('orderItems.foodItem', 'name image price originalPrice isVeg nutrition category')
            .populate('shippingAddress')
            .populate('billingAddress')
            .populate('paymentId')
            .populate('couponId');

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
                user: order.user,
                status: order.status,
                paymentStatus: order.paymentStatus,
                totalAmount: order.totalAmount,
                discountAmount: order.discountAmount,
                deliveryFee: order.deliveryFee,
                expectedDeliveryDate: order.expectedDeliveryDate,
                actualDeliveryDate: order.actualDeliveryDate,
                razorpayOrderId: order.razorpayOrderId,
                placedAt: order.placedAt,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                items: order.orderItems.map(item => ({
                    foodItemId: item.foodItem?._id,
                    name: item.foodItem?.name,
                    image: item.foodItem?.image || '',
                    isVeg: item.foodItem?.isVeg,
                    category: item.foodItem?.category,
                    quantity: item.quantity,
                    customization: item.customization,
                    price: item.price,
                    addOnsTotal: item.addOnsTotal,
                    originalPrice: item.originalPrice,
                    subTotal: item.subTotal
                })),
                shippingAddress: order.shippingAddress,
                billingAddress: order.billingAddress,
                payment: order.paymentId,
                coupon: order.couponId,
                isScheduled: order.isScheduled || false,
                scheduledDate: order.scheduledDate,
                scheduledTimeSlot: order.scheduledTimeSlot
            }
        });

    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch order details",
            error: error.message
        });
    }
};

/**
 * Update Order Status (Admin)
 * PATCH /admin/orders/:orderId/status
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentStatus, expectedDeliveryDate } = req.body;

        const validStatuses = [
            'order_placed', 'processing', 'ready', 'out_for_delivery',
            'delivered', 'cancelled', 'refund_initiated',
            'refund_completed', 'pending'
        ];
        const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                status: false,
                message: "Invalid order status"
            });
        }

        if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                status: false,
                message: "Invalid payment status"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                status: false,
                message: "Order not found"
            });
        }

        // Update status
        if (status) {
            order.status = status;
        }

        if (paymentStatus) {
            order.paymentStatus = paymentStatus;

            // Also update payment record if exists
            if (order.paymentId) {
                await Payment.findByIdAndUpdate(order.paymentId, {
                    status: paymentStatus,
                    ...(paymentStatus === 'paid' && { paidAt: new Date() })
                });
            }
        }

        // Update expected delivery date
        if (expectedDeliveryDate) {
            order.expectedDeliveryDate = new Date(expectedDeliveryDate);
        }

        // If delivered, set actual delivery date
        if (status === 'delivered') {
            order.actualDeliveryDate = new Date();
        }

        await order.save();

        // Fetch updated order with populated fields
        const updatedOrder = await Order.findById(orderId)
            .populate('user', 'name email')
            .populate('paymentId', 'method status');

        res.status(200).json({
            status: true,
            message: "Order status updated successfully",
            order: {
                orderId: updatedOrder._id,
                status: updatedOrder.status,
                paymentStatus: updatedOrder.paymentStatus,
                expectedDeliveryDate: updatedOrder.expectedDeliveryDate,
                actualDeliveryDate: updatedOrder.actualDeliveryDate,
                user: updatedOrder.user,
                payment: updatedOrder.paymentId,
                updatedAt: updatedOrder.updatedAt
            }
        });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            status: false,
            message: "Failed to update order status",
            error: error.message
        });
    }
};

module.exports = {
    getAllOrders,
    getOrderDetails,
    updateOrderStatus
};
