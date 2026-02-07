const express = require('express');
const User = require('../../../models/user-model');
const Order = require('../../../models/order-model');
const Cart = require('../../../models/cart-model');
const Subscription = require('../../../models/subscription-model');

// Get all users for admin (basic list)
const getAllUsersController = async (req, res) => {
    try {
        const users = await User.find({ isDeleted: { $ne: true } })
            .select('-password') // Exclude password
            .sort({ createdAt: -1 });

        if (!users) {
            return res.status(404).json({ status: false, message: "No users found" });
        }

        // Get order counts for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const orderCount = await Order.countDocuments({ user: user._id, isDeleted: { $ne: true } });
            return {
                ...user.toObject(),
                orderCount
            };
        }));

        res.status(200).json({
            status: true,
            count: users.length,
            users: usersWithStats,
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Error fetching users",
            error: error.message,
        });
    }
};

// Get detailed user info for admin view
const getUserDetailsController = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ status: false, message: "User ID is required" });
        }

        // Get user with populated addresses and wishlist
        const user = await User.findById(userId)
            .select('-password')
            .populate({
                path: 'addresses',
                options: { sort: { isDefault: -1 } }
            })
            .populate({
                path: 'wishlist',
                select: 'name price originalPrice discount images brand'
            });

        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        // Get user's cart with populated food items
        let cart = null;
        if (user.cart) {
            cart = await Cart.findById(user.cart).populate({
                path: 'items.foodItem',
                select: 'name price originalPrice discount image isVeg'
            });
        }

        // Get user's orders
        const orders = await Order.find({ user: userId, isDeleted: { $ne: true } })
            .populate({
                path: 'orderItems.foodItem',
                select: 'name price image isVeg'
            })
            .populate('shippingAddress')
            .sort({ createdAt: -1 })
            .limit(20); // Last 20 orders

        // Get user's subscriptions (active + previous)
        const subscriptions = await Subscription.find({
            user: userId
        })
            .populate('salad', 'name image')
            .sort({ createdAt: -1 });

        // Calculate stats
        const stats = {
            totalOrders: orders.length,
            totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
            wishlistCount: user.wishlist?.length || 0,
            cartItemsCount: cart?.items?.length || 0,
            addressesCount: user.addresses?.length || 0
        };

        res.status(200).json({
            status: true,
            user: user.toObject(),
            cart: cart ? cart.toObject() : null,
            orders,
            subscriptions: subscriptions.map((sub) => ({
                id: sub._id,
                planName: sub.planSnapshot?.name,
                planDays: sub.planSnapshot?.days,
                salad: sub.saladSnapshot,
                totalAmount: sub.totalAmount,
                status: sub.status,
                paymentStatus: sub.paymentStatus,
                deliveryDetails: sub.deliveryDetails,
                startDate: sub.startDate,
                endDate: sub.endDate,
                createdAt: sub.createdAt
            })),
            stats
        });

    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({
            status: false,
            message: "Error fetching user details",
            error: error.message,
        });
    }
};

module.exports = {
    getAllUsersController,
    getUserDetailsController
};