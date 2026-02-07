const mongoose = require("mongoose");
const highlightSchema = require("./highlight-model");
const offerSchema = require("./offer-model");
const deliveryDetailsSchema = require("./deliveryDetails-model");


const productSchema = new mongoose.Schema(
  {

    name: { type: String, required: true },

    brand: { type: String },

    price: { type: Number, required: true },

    originalPrice: { type: Number },

    discount: { type: Number },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },    
    
    // quantity: { type: Number, default: 0 }, 

    soldCount: { type: Number, default: 0 },

    // no need of review

    // reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
   
    averageRating: { type: Number, default: 0 },

    reviewCount: { type: Number, default: 0 },

    images: [{ type: String }],

    size: {
    type: [String],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], // allowed T-shirt sizes
    default:['XS', 'S', 'M', 'L', 'XL', 'XXL'] // default sizes
  },

    description: { type: String },

    highlights:highlightSchema,

    offers: [{
       type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer' ,
        default: []
      }],

    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // deliveryDetails: deliveryDetailsSchema,

    // percentRecommended: { type: Number, default: 0 },
    isFreeShipping:{
      type:Boolean,
      // required:true 
    },

    estimateDelivery:{
      type:String,
      default:""
    },

    isActive: { type: Boolean, default: true },

    isDeleted: { type: Boolean, default: false }

  },
  
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text' }); //  <---- added for fast searching

const Product = mongoose.model("Product", productSchema);
module.exports = {Product};
