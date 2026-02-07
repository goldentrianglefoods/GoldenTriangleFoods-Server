const Category = require('../../../models/category-model');
const fs = require("fs");
const { uploadOnCloudinary, deleteFromCloudinary } = require('../../../utils/cloudinary');
const { count } = require('console');

// Create Category Controller
const createCategoryController = async (req, res) => {

    try {
        const { name, description, parent_id } = req.body;
    const categoryImage = req.file ? req.file.path : null;
    
    // Validation for required fields   
    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    const upload = await uploadOnCloudinary(req.file.path);

    // Create new category
    const category = new Category({
      name,
      description,
      categoryImage: upload.secure_url,
      cloudinaryID:upload.public_id,
      parent_id: parent_id || null,
    });  

    await category.save(); 

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });

    } catch (error) {
        res.status(500).json({
        success: false,
        message: "Error creating category",
        error: err.message,
        });

        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    }

}

// Get All Categories 
const getAllCategoriesController = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({
            success: true,
            message: "get all categories successfully",
            categories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
            error: error.message,
        });
    }
};

// get Category by search like name, etc.

const getCategoryByQueryController = async (req, res) => {
    try {

        const search = req.query.q || "";
        const categories = await Category.find({
        $or: [
            { name: { $regex: search, $options: "i" } },       // match name
            { description: { $regex: search, $options: "i" } } // match description
        ]
    }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            categories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching categories by query",
            error: error.message,
        });
    }
};


// Get Single Category by ID
const getCategoryByIdController = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "get category successfully",
            category,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching category",
            error: error.message,
        });
    }
};


// Update Category
const updateCategoryController = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Not found" });

    if (req.file) {
      await deleteFromCloudinary(category.cloudinaryID);
      const result = await uploadOnCloudinary(req.file.path);
      category.categoryImage = result.secure_url;
      category.cloudinaryID = result.public_id;
    }

    category.name = req.body.name || category.name;
    category.description = req.body.description || category.description;
    category.isActive = req.body.isActive ?? category.isActive;
    category.parent_id = req.body.parent_id || category.parent_id;

    const updated = await category.save();
    res.status(200).json(
      { 
        success: true,
        message: "Category updated",
        updated,
        });


  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ 
      success: false,
      message: "Error updating category",
      error: error.message 
    });
  }
};


// delete Category
const deleteCategoryController = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findByIdAndDelete(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Delete image from Cloudinary
        await deleteFromCloudinary(category.cloudinaryID);

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            category,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting category",
            error: error.message,
        });
    }
};



module.exports = {createCategoryController,getAllCategoriesController,getCategoryByIdController,updateCategoryController,deleteCategoryController,getCategoryByQueryController};
    

