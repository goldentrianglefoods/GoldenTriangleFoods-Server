const express = require("express");
const { getAllOffersController, getOfferByIdController, searchOffersController, getAllActiveOffersController} = require("../controllers/web/v1/offerController");
const authMiddleware = require("../middleware/authMiddleware");


// All Routes for User DashBoard - Offer Management


const userOfferRoutes = express.Router();


// Route to get all active  offers only
userOfferRoutes.get("/get-all-active-offers",authMiddleware,getAllActiveOffersController);  // this is also important most probably used in frontend for displaying active offers


// Route to get offer by id
userOfferRoutes.get("/get-offers/:id",authMiddleware,getOfferByIdController); // this is important --> most probably used in frontend applying offer to product


// Route to get offer by search query for active offers
userOfferRoutes.get("/search-offers",authMiddleware,searchOffersController);


// export offer routes
module.exports = userOfferRoutes;