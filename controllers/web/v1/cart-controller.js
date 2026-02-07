const Cart = require("../../../models/cart-model");
const { FoodItem } = require("../../../models/foodItem-model");
const Address = require("../../../models/address-model");
const { calculateDeliveryFee } = require("../../../utils/delivery-fee");
const { forwardGeocodeAddress } = require("../../../utils/geocode");

// Helper function to calculate cart total including add-ons
const calculateFoodCartTotal = (items) => {
  return items.reduce((total, item) => {
    const itemTotal = (item.priceSnapshot + item.addOnsTotal) * item.quantity;
    return total + itemTotal;
  }, 0);
};

// Controller for add food item to cart
const addToCartController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { foodItemId, quantity = 1, customization = {} } = req.body;

    if (!foodItemId) {
      return res.status(400).json({ message: "foodItemId is required" });
    }

    const foodItem = await FoodItem.findOne({
      _id: foodItemId,
      isActive: true,
      isDeleted: false
    });

    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found" });
    }

    // Calculate add-ons total from customization
    let addOnsTotal = 0;
    if (customization.addedOptionals && customization.addedOptionals.length > 0) {
      addOnsTotal = customization.addedOptionals.reduce((sum, opt) => sum + (opt.price || 0), 0);
    }

    let cart = await Cart.findOne({ user: userId });

    // Lazy cart creation
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [], total: 0 });
    }

    // Check if same item with same customization exists
    const customizationKey = JSON.stringify({
      removed: customization.removedIngredients || [],
      added: (customization.addedOptionals || []).map(o => o.name).sort()
    });

    const existingItemIndex = cart.items.findIndex(item => {
      const itemCustomKey = JSON.stringify({
        removed: item.customization?.removedIngredients || [],
        added: (item.customization?.addedOptionals || []).map(o => o.name).sort()
      });
      return item.foodItem.toString() === foodItemId && itemCustomKey === customizationKey;
    });

    if (existingItemIndex !== -1) {
      // Update quantity if same item with same customization
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        foodItem: foodItemId,
        customization: {
          removedIngredients: customization.removedIngredients || [],
          addedOptionals: customization.addedOptionals || [],
          specialInstructions: customization.specialInstructions || ""
        },
        quantity,
        priceSnapshot: foodItem.price,
        addOnsTotal
      });
    }

    cart.total = calculateFoodCartTotal(cart.items);
    await cart.save();

    const cartCount = cart.items.length;

    return res.status(200).json({
      status: true,
      success: true,
      message: "Item added to cart",
      cartCount,
      cart
    });

  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({ status: false, message: "Server error", error: error.message });
  }
};

// Controller for update cart item quantity
const updateCartItemController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { foodItemId, quantity, customizationIndex } = req.body;

    if (!foodItemId || quantity < 1) {
      return res.status(400).json({ message: "foodItemId and valid quantity are required" });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find item by index or by foodItemId
    let itemIndex = customizationIndex !== undefined ? customizationIndex :
      cart.items.findIndex(item => item.foodItem.toString() === foodItemId);

    if (itemIndex === -1 || !cart.items[itemIndex]) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.total = calculateFoodCartTotal(cart.items);

    await cart.save();

    return res.status(200).json({
      status: true,
      message: "Cart updated",
      cart
    });

  } catch (error) {
    console.error("Update cart error:", error);
    return res.status(500).json({ status: false, message: "Server error", error: error.message });
  }
};

// Controller for remove cart item
const removeFromCartController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { foodItemId, itemIndex } = req.params;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const initialLength = cart.items.length;

    if (itemIndex !== undefined && !isNaN(parseInt(itemIndex))) {
      // Remove by index
      cart.items.splice(parseInt(itemIndex), 1);
    } else {
      // Remove by foodItemId (removes first match)
      const idx = cart.items.findIndex(item => item.foodItem.toString() === foodItemId);
      if (idx !== -1) {
        cart.items.splice(idx, 1);
      }
    }

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.total = calculateFoodCartTotal(cart.items);
    await cart.save();

    return res.status(200).json({
      message: "Item removed from cart",
      cart
    });

  } catch (error) {
    console.error("Remove cart item error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get cart controller
const getCartController = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.foodItem",
        select: "name image price originalPrice discount nutrition isVeg prepTime"
      });

    if (!cart) {
      return res.status(200).json({
        items: [],
        total: 0,
        totalDiscount: 0
      });
    }

    // Calculate total discount and enhance items
    let totalDiscount = 0;
    const enhancedItems = cart.items.map(item => {
      const foodItem = item.foodItem;
      if (!foodItem) return null; // Skip if food item was deleted

      const originalPrice = foodItem.originalPrice || foodItem.price;
      const currentPrice = foodItem.price;
      const discount = foodItem.discount || (originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0);
      const itemDiscount = (originalPrice - currentPrice) * item.quantity;

      totalDiscount += itemDiscount;

      return {
        foodItem: {
          _id: foodItem._id,
          name: foodItem.name,
          price: foodItem.price,
          originalPrice: originalPrice,
          discount: discount,
          image: foodItem.image,
          isVeg: foodItem.isVeg,
          nutrition: foodItem.nutrition,
          prepTime: foodItem.prepTime
        },
        customization: item.customization,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        addOnsTotal: item.addOnsTotal,
        itemTotal: (item.priceSnapshot + item.addOnsTotal) * item.quantity,
        itemDiscount: itemDiscount
      };
    }).filter(Boolean);

    // Calculate delivery fee based on distance (if addressId provided)
    const subtotal = cart.total;
    let deliveryFee = 49;
    const addressId = req.query.addressId;
    if (addressId) {
      const address = await Address.findOne({ _id: addressId, userId });
      if (address) {
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
        console.log("[cart] delivery fee address", {
          addressId,
          lat: address.latitude ?? null,
          lng: address.longitude ?? null,
        });
        deliveryFee = await calculateDeliveryFee(address.latitude, address.longitude, subtotal);
        console.log("[cart] delivery fee result", { addressId, deliveryFee, subtotal });
      }
    }
    const totalAmount = subtotal + deliveryFee;

    return res.status(200).json({
      items: enhancedItems,
      total: cart.total,
      totalDiscount: totalDiscount,
      deliveryFee: deliveryFee,
      totalAmount: totalAmount,
      isFreeDelivery: deliveryFee === 0
    });

  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Controller for clear cart
const clearCartController = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(200).json({ message: "Cart already empty" });
    }

    cart.items = [];
    cart.total = 0;

    await cart.save();

    return res.status(200).json({ message: "Cart cleared successfully" });

  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update special instructions for an item
const updateSpecialInstructionsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemIndex, specialInstructions } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart || !cart.items[itemIndex]) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.items[itemIndex].customization.specialInstructions = specialInstructions || "";
    await cart.save();

    return res.status(200).json({
      status: true,
      message: "Special instructions updated",
      cart
    });

  } catch (error) {
    console.error("Update special instructions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addToCartController,
  updateCartItemController,
  removeFromCartController,
  getCartController,
  clearCartController,
  updateSpecialInstructionsController
};