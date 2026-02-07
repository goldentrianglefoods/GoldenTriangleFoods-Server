const mongoose = require('mongoose');


const offerSchema = new mongoose.Schema(
  {
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String }, 
  copyCode: { type: String },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
},{timestamps:true}
);

const Offer = mongoose.model("Offer",offerSchema);

module.exports = Offer;