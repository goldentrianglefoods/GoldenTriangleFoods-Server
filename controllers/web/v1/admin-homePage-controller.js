const fs = require("fs");
const HomePage = require("../../../models/homePage-model");
const { uploadOnCloudinary } = require("../../../utils/cloudinary");

/* ================= HELPER ================= */
// safely parse JSON or return object as-is
const safeParse = (value, defaultValue) => {
  if (!value) return defaultValue;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (err) {
      throw new Error("Invalid JSON format in request body");
    }
  }
  return value; // already object
};

/* ================= CREATE / UPDATE HOME PAGE ================= */
const uploadHomePageController = async (req, res) => {
  try {
    let {
      heroCarousel,
      featuredSection,
      stealzOfMonth,
      collectionSections,
    } = req.body;

    // ✅ SAFE PARSING (FIX FOR YOUR ERROR)
    heroCarousel = safeParse(heroCarousel, []);
    featuredSection = safeParse(featuredSection, []);
    stealzOfMonth = safeParse(stealzOfMonth, {});
    collectionSections = safeParse(collectionSections, []);

    /* ---------- Upload Hero Images ---------- */
    if (req.files?.heroImages?.length) {
      if (req.files.heroImages.length !== heroCarousel.length) {
        return res.status(400).json({
          success: false,
          message: "Hero images count must match heroCarousel length",
        });
      }

      for (let i = 0; i < heroCarousel.length; i++) {
        const upload = await uploadOnCloudinary(req.files.heroImages[i].path);
        heroCarousel[i].imageUrl = upload.secure_url;
      }
    }

    /* ---------- Upload Featured Images ---------- */
    if (req.files?.featuredImages?.length) {
      if (req.files.featuredImages.length !== featuredSection.length) {
        return res.status(400).json({
          success: false,
          message: "Featured images count must match featuredSection length",
        });
      }

      for (let i = 0; i < featuredSection.length; i++) {
        const upload = await uploadOnCloudinary(
          req.files.featuredImages[i].path
        );
        featuredSection[i].imageUrl = upload.secure_url;
      }
    }

    /* ----------   UPLOAD HOMEPAGE ---------- */
    const homePage = await HomePage.findOneAndUpdate(
      {},
      {
        heroCarousel,
        featuredSection,
        stealzOfMonth,
        collectionSections,
      },
      { new: true, upsert: true }
    );

    /* ---------- CLEANUP LOCAL FILES ---------- */
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
    }

    res.status(200).json({
      success: true,
      message: "Homepage data saved successfully",
      data: homePage,
    });
  } catch (error) {
    console.error("Upload HomePage Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save homepage",
      error: error.message,
    });
  }
};

/* ================= GET HOME PAGE ================= */
const getHomePageController = async (req, res) => {
  try {
    const homePage = await HomePage.findOne();

    res.status(200).json({
      success: true,
      message: "Homepage data fetched successfully",
      data: homePage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch homepage",
      error: error.message,
    });
  }
};


// DELETE by id HOME PAGE CONTROLLER 

const deleteHomePageByIdController = async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) { 
      return res.status(400).json({
        success: false,
        message: "Homepage ID is required",
      }); 
    }
    await HomePage.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: "Homepage data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete homepage",
      error: error.message,
    });
  }
};

module.exports = {
  uploadHomePageController,
  getHomePageController,
  deleteHomePageByIdController,
};
