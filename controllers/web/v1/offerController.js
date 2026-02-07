const Offer = require("../../../models/offer-model");
const { Product } = require("../../../models/product-model");
const { uploadOnCloudinary, deleteFromCloudinary } = require('../../../utils/cloudinary');
const fs = require("fs");

// Create new offer + update related products
const createOfferController = async (req, res) => {
  try {
    const {
      title,
      description,
      copyCode,
      startAt,
      endAt,
      isActive,
      applicableProducts
    } = req.body;

    // Handle image upload
    let iconUrl = "";
    let cloudinaryId = "";

    if (req.file) {
      const upload = await uploadOnCloudinary(req.file.path);
      if (upload) {
        iconUrl = upload.secure_url;
        cloudinaryId = upload.public_id;
      }
    }

    //  Create new offer
    const offer = new Offer({
      title,
      description,
      icon: iconUrl,
      cloudinaryID: cloudinaryId, // Assuming you might want to store this for deletion later, though not explicitly requested, it's good practice based on category controller
      copyCode,
      startAt,
      endAt,
      isActive,
      applicableProducts
    });

    const savedOffer = await offer.save();

    //  Automatically update related products
    if (applicableProducts && applicableProducts.length > 0) {
      await Product.updateMany(
        { _id: { $in: applicableProducts } },
        { $addToSet: { offers: savedOffer._id } } // avoids duplicates
      );
    }

    res.status(201).json({
      message: "Offer created successfully and applied to products!",
      offer: savedOffer
    });

  } catch (error) {
    console.error("Error creating offer:", error);
    // Clean up local file if it exists and there was an error
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// get all offers controller
const getAllOffersController = async (req, res) => {
  try {
      const offers = await Offer.find();
      if (!offers) {
          return res.status(404).json({
             message: "No offers found" ,
            });
      }
      res.status(200).json({
        status: "true",
        message: "Offers retrieved successfully",
        offers: offers,
      });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: "Error while getting offers",
      error: error.message,
    });
  }
};


// get all active offers controller
const getAllActiveOffersController = async (req, res) => {
  try {
      const offers = await Offer.find({isActive: true});
      if (!offers) {
          return res.status(404).json({
             message: "No active offers found" ,
            });
      }
      res.status(200).json({
        status: "true",
        count: offers.length,
        offers: offers,
      });
  } catch (error) {
    res.status(500).json({
      status: "false",
      message: "Error while getting offers",
      error: error.message,
    });
  }
};


// delete offer controller (admin only)
const deleteOfferController = async (req, res) => {
  try {
      const { id } = req.params;

      if(!id){
        return res.status(400).json({
          message: "Offer ID is required",
        });
      } 
      
      const deletedOffer = await Offer.findByIdAndDelete(id);
     
      if (!deletedOffer) {
          return res.status(404).json({
             message: "Offer not found" ,
            });
      }
      // Remove offer reference from products
      await Product.updateMany(
        { offers: id },
        { $pull: { offers: id } }   // pull is an operator that removes a value from an array
      );

      res.status(200).json({
        success: true,
        message: "Offer deleted and removed from all products",
        offer: deletedOffer
      });


  } catch (error) {

    res.status(500).json({
      status: "false",
      message: "Error while deleting offer",
      error: error.message,
    });
  }
};

// update offer controller (admin only)

const updateOfferController = async (req, res) => {
  try {
      const { id } = req.params;

      if(!id){
        return res.status(400).json({
          message: "Offer ID is required",
        });
      }   
      
      // Find existing offer to get old data (for image deletion and product sync)
      const existingOffer = await Offer.findById(id);
      if (!existingOffer) {
          return res.status(404).json({
             message: "Offer not found" ,
            });
      }

      let updateData = { ...req.body };

      // Handle applicableProducts (ensure it's an array if present)
      // When sending FormData, a single array item might come as a string
      if (updateData.applicableProducts && !Array.isArray(updateData.applicableProducts)) {
          updateData.applicableProducts = [updateData.applicableProducts];
      }

      // Handle Image Upload
      if (req.file) {
          const upload = await uploadOnCloudinary(req.file.path);
          if (upload) {
              updateData.icon = upload.secure_url;
              updateData.cloudinaryID = upload.public_id;

              // Delete old image from Cloudinary if it exists
              if (existingOffer.cloudinaryID) {
                  await deleteFromCloudinary(existingOffer.cloudinaryID);
              }
          }
      }

      // Update the offer
      const updatedOffer = await Offer.findByIdAndUpdate(id, updateData, { 
        new: true,
        runValidators: true 
      });

      // Sync Products if applicableProducts has changed
      if (updateData.applicableProducts) {
          const oldProducts = existingOffer.applicableProducts.map(p => p.toString());
          const newProducts = updateData.applicableProducts;

          // Products to remove offer from: present in old but NOT in new
          const toRemove = oldProducts.filter(p => !newProducts.includes(p));
          
          // Products to add offer to: present in new but NOT in old
          const toAdd = newProducts.filter(p => !oldProducts.includes(p));

          if (toRemove.length > 0) {
              await Product.updateMany(
                  { _id: { $in: toRemove } },
                  { $pull: { offers: id } }
              );
          }

          if (toAdd.length > 0) {
              await Product.updateMany(
                  { _id: { $in: toAdd } },
                  { $addToSet: { offers: id } }
              );
          }
      }

      res.status(200).json({
        success: true,
        message: "Offer updated successfully",
        offer: updatedOffer
      });   

  } catch (error) {
    console.error("Update offer error:", error);
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      status: "false",
      message: "Error while updating offer",
      error: error.message,
    });

  }
};

// get offer by id controller
const getOfferByIdController = async (req, res) => {
  try {
      const { id } = req.params;

      if(!id){
        return res.status(400).json({
          message: "Offer ID is required",
        });
      }  
      
      const offer = await Offer.findById(id);

      if (!offer) {
          return res.status(404).json({
             message: "Offer not found" ,
            });
      }

      res.status(200).json({
        success: true,
        message: "Offer retrieved successfully",
        offer: offer
      });   

  } catch (error) {

    res.status(500).json({
      status: "false",
      message: "Error while retrieving offer",
      error: error.message,
    });

  }
};

// search offers controller if offer is "active"

const searchOffersController = async (req, res) => {
    try {
      const search  = req.query.search || "";

      const offers = await Offer.find({
          isActive: true,
          $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { copyCode: { $regex: search, $options: "i" } }
        ],
      });

      if (offers.length === 0) {
          return res.status(404).json({
             message: "No offers match your search criteria" ,
            });
      }

      res.status(200).json({
        success: true,
        count: offers.length,
        offers: offers
      });   

    } catch (error) {

      res.status(500).json({
        status: "false",
        message: "Error while searching offers",
        error: error.message,
      }); 
          
    }
};
   

// export controllers 

module.exports = { createOfferController ,getAllOffersController , deleteOfferController , updateOfferController, getOfferByIdController,searchOffersController, getAllActiveOffersController };
