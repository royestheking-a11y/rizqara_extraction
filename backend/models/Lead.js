const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String },
  phone: { type: String },
  website: { type: String },
  email: { type: String },
  address: { type: String },
  rating: { type: String },
  reviews: { type: String },
  facebook: { type: String },
  instagram: { type: String },
  linkedin: { type: String },
  score: { type: Number, default: 0 },
  extractedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);
