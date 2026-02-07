const express = require("express");
const { createOfferController, getAllOffersController, getOfferByIdController, searchOffersController, updateOfferController, deleteOfferController, getAllActiveOffersController } = require("../controllers/web/v1/offerController");


// All Routes for Admin DashBoard - Offer Management


const offerRoutes = express.Router();

const { upload } = require("../middleware/multerMiddleware");

// Route to create a new offer
offerRoutes.post("/create-offer", upload.single("icon"), createOfferController);

// Route to get all offers
offerRoutes.get("/get-all-offers", getAllOffersController);

// Route to get all active offers
offerRoutes.get("/get-all-active-offers", getAllActiveOffersController);

// Route to get offer by id
offerRoutes.get("/get-offer/:id",getOfferByIdController);

// Route to get offer by search query for active offers
offerRoutes.get("/search-offers",searchOffersController);

// Route to update an offer by id
offerRoutes.patch("/update-offer/:id", upload.single("icon"), updateOfferController);

// Route to delete an offer by id
offerRoutes.delete("/delete-offer/:id",deleteOfferController);

// export offer routes
module.exports = offerRoutes;