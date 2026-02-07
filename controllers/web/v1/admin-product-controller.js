const { Product } = require("../../../models/product-model.js");
require("dotenv").config();
const mongoose = require("mongoose");
const { uploadOnCloudinary, deleteFromCloudinary } = require("../../../utils/cloudinary.js");
const fs = require("fs");


// upload product controller
const uploadProductController = async (req, res) => {
  try {
    const {
      name,
      brand,
      price,
      originalPrice,
      discount,
      category,
      soldCount,
      reviews,
      averageRating,
      reviewCount,
      size,
      description,
      highlights,
      offers,
      isFreeShipping,
      estimateDelivery,
      isActive,
      isDeleted,
    } = req.body;

    // Validation for required fields
    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required."});
    }

    // Upload multiple images to Cloudinary
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const uploaded = await uploadOnCloudinary(file.path);
        return uploaded?.secure_url;
      });
      imageUrls = await Promise.all(uploadPromises);
    }

    // Create product
    const product = new Product({
      name,
      brand,
      price,
      originalPrice,
      discount,
      category: category ? new mongoose.Types.ObjectId(category) : null,
      soldCount,
      reviews,
      averageRating,
      reviewCount,
      images: imageUrls, // store array of Cloudinary URLs
      size,
      description,
      highlights,
      offers,
      isFreeShipping,
      estimateDelivery,
      isActive,
      isDeleted,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product uploaded successfully",
      product,
    });

     if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error uploading product",
      error: err.message,
    });
 
      if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

  }
};

// fetch product controller -- design this in one place in public 

// delete product controller
const deleteProductController = async(req,res)=>{
   try{
    const {id} = req.body;
      if (!id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }
    const product = await Product.findByIdAndDelete(id);
    if(!product){
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Product deleted successfully" });
   }catch(err){
    res.status(500).json({ success: false, message: "Error deleting product" ,error:err.message});
   }

};



// Update Product Controller
const updateProductController = async (req, res) => {
  try {
    const { id } = req.body;
    console.log("Update request for product ID:", id);

    // Validate Product ID
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    // Find the product first
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Default: keep existing images
    let imageUrls = existingProduct.images || [];

    // delete old images from cloudinary if needed
    

    // If new images are uploaded → replace old ones
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const uploaded = await uploadOnCloudinary(file.path);
        return uploaded?.secure_url;
      });

      // Wait for all uploads to finish
      imageUrls = await Promise.all(uploadPromises);

      // Delete temporary files after upload
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    // Prepare updated data
    const updatedData = {
      ...req.body,
      images: imageUrls, // updated or kept old ones
    };

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    // Send success response
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });

  } catch (error) {
    console.error("Error updating product:", error.message);

    // Cleanup uploaded temp files (in case of error)
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

module.exports = {uploadProductController,deleteProductController,updateProductController};