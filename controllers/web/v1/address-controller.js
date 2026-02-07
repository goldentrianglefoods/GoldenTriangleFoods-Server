const Address = require("../../../models/address-model");
const User = require("../../../models/user-model");

// Add a new address
const addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      alternatePhone,
      houseNumber,
      building,
      street,
      landmark,
      city,
      state,
      pincode,
      addressType,
      latitude,
      longitude,
      lat,
      lng,
    } = req.body;

    const userId = req.user.id; // From authMiddleware

    // Check if user already has 4 addresses (maximum limit)
    const existingAddressCount = await Address.countDocuments({ userId });
    if (existingAddressCount >= 4) {
      return res.status(400).json({ 
        status: false, 
        message: "Maximum 4 addresses allowed. Please delete an existing address to add a new one." 
      });
    }

    const newAddress = new Address({
      userId,
      fullName,
      phone,
      ...(alternatePhone && { alternatePhone }),
      houseNumber,
      ...(building && { building }),
      street,
      ...(landmark && { landmark }),
      city,
      state,
      pincode,
      addressType,
      ...(latitude !== undefined && latitude !== null && latitude !== "" ? { latitude: Number(latitude) } : {}),
      ...(longitude !== undefined && longitude !== null && longitude !== "" ? { longitude: Number(longitude) } : {}),
      ...(latitude === undefined && lat !== undefined && lat !== null && lat !== "" ? { latitude: Number(lat) } : {}),
      ...(longitude === undefined && lng !== undefined && lng !== null && lng !== "" ? { longitude: Number(lng) } : {}),
    });

    const savedAddress = await newAddress.save();

    // Add address ID to user's addresses array
    await User.findByIdAndUpdate(
      userId,
      { $push: { addresses: savedAddress._id } }
    );

    res.status(201).json({ status: true, message: "Address added successfully", address: savedAddress });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ status: false, message: "Failed to add address", error: error.message });
  }
};

// Get all addresses for a user
const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ status: true, addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ status: false, message: "Failed to fetch addresses", error: error.message });
  }
};

// Update an address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = { ...req.body };

    if (updateData.latitude === undefined && updateData.lat !== undefined) {
      updateData.latitude = updateData.lat;
    }
    if (updateData.longitude === undefined && updateData.lng !== undefined) {
      updateData.longitude = updateData.lng;
    }

    // Remove empty strings for optional fields to prevent validation errors
    if (updateData.alternatePhone === "") delete updateData.alternatePhone;
    if (updateData.building === "") delete updateData.building;
    if (updateData.landmark === "") delete updateData.landmark;
    if (updateData.latitude === "" || updateData.latitude === undefined) delete updateData.latitude;
    if (updateData.longitude === "" || updateData.longitude === undefined) delete updateData.longitude;

    if (updateData.latitude !== undefined) updateData.latitude = Number(updateData.latitude);
    if (updateData.longitude !== undefined) updateData.longitude = Number(updateData.longitude);

    const address = await Address.findOne({ _id: id, userId });

    if (!address) {
      return res.status(404).json({ status: false, message: "Address not found" });
    }

    const updatedAddress = await Address.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ status: true, message: "Address updated successfully", address: updatedAddress });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ status: false, message: "Failed to update address", error: error.message });
  }
};

// Delete an address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await Address.findOneAndDelete({ _id: id, userId });

    if (!address) {
      return res.status(404).json({ status: false, message: "Address not found" });
    }

    // Remove address ID from user's addresses array
    await User.findByIdAndUpdate(
      userId,
      { $pull: { addresses: id } }
    );

    res.status(200).json({ status: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ status: false, message: "Failed to delete address", error: error.message });
  }
};

module.exports = {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
};
