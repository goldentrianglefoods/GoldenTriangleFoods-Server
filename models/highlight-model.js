
const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
  design: { type: String },
  fit: { type: String },
  neck: { type: String },
  occasion: { type: String },
  sleeve: { type: String },
  washCare: { type: String },
});

module.exports = highlightSchema; 