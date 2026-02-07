const User = require("../../../models/user-model");

// controller for wishlist add
const addToWishlistController = async (req, res) => {
  try {
    const { foodItemId } = req.body;

    if (!foodItemId) {
      return res.status(400).json({ message: "foodItemId is required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // prevent duplicate
    if (user.wishlist.includes(foodItemId)) {
      return res.status(409).json({ message: "Item already in wishlist" });
    }

    user.wishlist.push(foodItemId);
    await user.save();

    res.status(200).json({
      message: "Item added to wishlist",
      wishlist: user.wishlist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// controller for wishlist remove
const removeFromWishlistController = async (req, res) => {
  try {
    const { foodItemId } = req.body;

    if (!foodItemId) {
      return res.status(400).json({ message: "foodItemId is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { wishlist: foodItemId } },
      { new: true }
    );

    res.status(200).json({
      message: "Item removed from wishlist",
      wishlist: user.wishlist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get wishlist controller
const getWishlistController = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("wishlist");

    res.status(200).json({
      count: user.wishlist.length,
      wishlist: user.wishlist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// toggle wishlist controller
const toggleWishlistController = async (req, res) => {
  try {
    const { foodItemId } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const index = user.wishlist.indexOf(foodItemId);

    if (index === -1) {
      user.wishlist.push(foodItemId);
      await user.save();

      return res.status(200).json({
        message: "Added to wishlist",
        added: true
      });
    } else {
      user.wishlist.splice(index, 1);
      await user.save();

      return res.status(200).json({
        message: "Removed from wishlist",
        added: false
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// clear wishlist controller
const clearWishlistController = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { wishlist: [] }
    });

    res.status(200).json({
      message: "Wishlist cleared"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




module.exports = { addToWishlistController, removeFromWishlistController, getWishlistController, toggleWishlistController, clearWishlistController };