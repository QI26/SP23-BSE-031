const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Product name
  model: { type: String, required: true }, // Model like BM6780-BLUE
  price: { type: Number, required: true }, // Product price
  originalPrice: { type: Number }, // Original price before discount
  color: { type: String, required: true }, // Product color
  size: { type: [Number], required: true }, // Array of sizes
  barcode: { type: String, unique: true }, // Product barcode
  availability: { type: String, default: "In stock" }, // Availability
  description: { type: String }, // Product description
  imageUrls: { type: String }, // image URLs
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
