const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  model: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  color: { type: String, required: true },
  size: { type: [Number], required: true },
  barcode: { type: String, unique: true },
  availability: { type: String, default: "In stock" },
  description: { type: String },
  imageUrls: { type: String },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // Relationship to Category
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
