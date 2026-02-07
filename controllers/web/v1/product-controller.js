const Category = require("../../../models/category-model");
const { Product } = require("../../../models/product-model");


// get all product
const allProductController = async(req,res)=>{
    try{
        const products = await Product.find().populate('category').populate('offers');
         if (!products)
           return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({
        status:true,
        count: products.length,
        message:"Get all product successfully",
        products:products
    });
    }catch(err){
        res.status(500).json({
            status:false,
            error:err.message
        });
    }
};

// get single product by ID
const singleProductController = async(req,res)=>{
    try{
        const {id} = req.params;
        const product = await Product.findById(id).populate('category', 'name');
        console.log(product);
        if (!product)
          return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({
        status:true,
        message:"Get single product successfully",
        product:product
    });
    }catch(err){
        res.status(500).json({
            status:false,
            error:err.message
        });
    }
};


// get product by category
const categoryProductController = async(req,res)=>{
    try{
        const {category} = req.params;
        const products = await Product.find({category});
        res.status(200).json({ success: true, count: products.length, products:products });
    }catch(err){
        res.status(500).json({
            status:false,
            error:err.message
        });
    }
};


// get product by search - Atlas Search with Fuzzy Matching
const searchProductController = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const searchQuery = query.trim();
    let products = [];

    // Try Atlas Search with fuzzy matching first
    try {
      products = await Product.aggregate([
        {
          $search: {
            index: "product_search", // Atlas Search index name
            compound: {
              should: [
                {
                  text: {
                    query: searchQuery,
                    path: "name",
                    fuzzy: {
                      maxEdits: 2, // allows up to 2 character mistakes
                      prefixLength: 1 // first character must match
                    },
                    score: { boost: { value: 3 } } // name matches are most important
                  }
                },
                {
                  text: {
                    query: searchQuery,
                    path: "brand",
                    fuzzy: {
                      maxEdits: 2,
                      prefixLength: 1
                    },
                    score: { boost: { value: 2 } }
                  }
                },
                {
                  text: {
                    query: searchQuery,
                    path: "description",
                    fuzzy: {
                      maxEdits: 2,
                      prefixLength: 1
                    }
                  }
                }
              ],
              minimumShouldMatch: 1
            }
          }
        },
        {
          $match: {
            isActive: true,
            isDeleted: false
          }
        },
        {
          $addFields: {
            searchScore: { $meta: "searchScore" }
          }
        },
        {
          $sort: { searchScore: -1 }
        },
        {
          $limit: 50
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category"
          }
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true
          }
        }
      ]);
    } catch (atlasError) {
      // Atlas Search index not available, fall back to regex search
      console.log("Atlas Search not available, using regex fallback:", atlasError.message);
      
      const escapeRegex = (text) =>
        text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

      const searchRegex = new RegExp(escapeRegex(searchQuery), "i");

      // Find matching categories
      const categories = await Category.find({
        name: searchRegex
      }).select("_id");

      const categoryIds = categories.map(cat => cat._id);

      // Find matching products with regex
      products = await Product.find({
        isActive: true,
        isDeleted: false,
        $or: [
          { name: searchRegex },
          { brand: searchRegex },
          { description: searchRegex },
          { category: { $in: categoryIds } }
        ]
      })
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(50);
    }

    // If still no results, try splitting the query into words
    if (products.length === 0 && searchQuery.includes(" ")) {
      const words = searchQuery.split(/\s+/).filter(w => w.length > 2);
      
      for (const word of words) {
        const wordRegex = new RegExp(word, "i");
        products = await Product.find({
          isActive: true,
          isDeleted: false,
          $or: [
            { name: wordRegex },
            { brand: wordRegex },
            { description: wordRegex }
          ]
        })
          .populate("category", "name")
          .sort({ createdAt: -1 })
          .limit(20);
        
        if (products.length > 0) break;
      }
    }

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


// Search products by category name with pagination
const categorySearchProductController = async (req, res) => {
  try {
    const { query, page, limit } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Category search query is required"
      });
    }

    const searchQuery = query.trim();
    const searchRegex = new RegExp(searchQuery, "i");

    // Pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Find categories matching the search query
    const matchingCategories = await Category.find({
      name: searchRegex,
      isActive: true
    });

    const categoryIds = matchingCategories.map(cat => cat._id);

    // Build query filter
    const filter = {
      category: { $in: categoryIds },
      isActive: true,
      isDeleted: false
    };

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Find products in those categories with pagination
    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      categories: matchingCategories.map(c => c.name),
      products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};



// ============= OPTIMIZATION #1: HOME PAGE DATA =============
// Consolidates 5 separate search calls into 1 endpoint
const getHomePageDataController = async (req, res) => {
  try {
    const sections = [
      { title: "Top Charts", query: "The most popular and trending designs everyone's rocking right now." },
      { title: "Main Character Drip", query: "Bold, standout pieces made for those who own the spotlight." },
      { title: "Hot Girls Picks", query: "Handpicked trendy styles for the confident and effortlessly stylish." },
      { title: "Not for Everyone", query: "Designed for those who don't blend in." },
      { title: "Balance Classics", query: "Where balance never goes out of style." }
    ];

    const results = {};
    
    for (const section of sections) {
      // Reuse existing search logic (regex fallback)
      const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const searchRegex = new RegExp(escapeRegex(section.query.split(" ").slice(0, 3).join(" ")), "i");

      const products = await Product.find({
        isActive: true,
        isDeleted: false,
        $or: [
          { name: searchRegex },
          { brand: searchRegex },
          { description: searchRegex }
        ]
      })
      .populate('category', 'name categoryImage')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

      results[section.title] = products;
    }

    res.json({ success: true, sections: results });
  } catch (error) {
    console.error('Error fetching home page data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch home page data', error: error.message });
  }
};


// ============= OPTIMIZATION #2: PRODUCT WITH REVIEWS & WISHLIST =============
// Combines product details + reviews + wishlist status into 1 call
const getSingleProductWithReviewsController = async (req, res) => {
  try {
    const { id } = req.params;
    const Review = require("../../../models/review-model");

    // 1. Fetch product with populated category
    const product = await Product.findById(id)
      .populate('category', 'name')
      .lean();
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // 2. Fetch reviews
    const reviews = await Review.find({ product: id })
      .sort({ createdAt: -1 })
      .lean();

    // 3. Check wishlist status (only if user is authenticated)
    let isInWishlist = false;
    if (req.user) {
      const User = require("../../../models/user-model");
      const user = await User.findById(req.user._id || req.user.id).select('wishlist');
      isInWishlist = user?.wishlist?.some(item => item.toString() === id) || false;
    }

    res.json({ 
      status: true,
      success: true,
      product,
      reviews,
      isInWishlist 
    });
  } catch (error) {
    console.error('Error fetching product data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product data', error: error.message });
  }
};


module.exports = {
  allProductController,
  singleProductController,
  searchProductController,
  categoryProductController,
  categorySearchProductController,
  getHomePageDataController,
  getSingleProductWithReviewsController
};

