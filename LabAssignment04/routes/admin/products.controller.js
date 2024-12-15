const express = require("express");
const multer = require("multer");
let router = express.Router();
let Product = require("../../models/product.model");
const path = require("path");

// Set up Multer storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save images in 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Timestamp the filename to prevent conflicts
  }
});

const upload = multer({ storage: storage });

// Route to handle Delete of product
router.get("/admin/products/delete/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products"); // Redirect back to the product list
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting product');
  }
});

// Route to render edit product form
router.get("/admin/products/edit/:id", async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    res.render("admin/product-edit-form", {
      layout: "adminlayout",
      product,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching product for editing');
  }
});

// Route to handle editing a product (POST)
router.post("/admin/products/edit/:id", upload.single("image"), async (req, res) => {
  try {
    // Retrieve product details from the request body and parameters
    const { name, model, price, originalPrice, color, size, barcode, availability, description } = req.body;
    const productId = req.params.id; // Get the product ID from the URL

    // Handle 'size' field - ensure it's an array
    let sizeArray = [];
    if (size) {
      sizeArray = size.split(",").map(Number); // Convert to an array of numbers
    }

    // Find the product by ID and update it
    let product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Update product details
    product.name = name;
    product.model = model;
    product.price = price;
    product.originalPrice = originalPrice;
    product.color = color;
    product.size = sizeArray; // Store array of sizes
    product.barcode = barcode;
    product.availability = availability;
    product.description = description;

    // Handle the uploaded image (only if a new image is uploaded)
    if (req.file) {
      product.imageUrls = `/uploads/${req.file.filename}`; // Update the image URL
    }

    // Log the image URL to verify it's generated correctly
    console.log("Updated Image URL:", product.imageUrls);

    // Save the updated product
    await product.save();

    // Redirect to the product list or another page after update
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send("Error updating product");
  }
});



// Route to render create product form
router.get("/admin/products/create", (req, res) => {
  res.render("admin/product-form", { layout: "adminlayout" });
});

// Route to handle create product form submission (POST)
router.post("/admin/products/create", upload.single("image"), async (req, res) => {
  try {
    // Retrieve product details from the request body
    const { name, model, price, originalPrice, color, size, barcode, availability, description } = req.body;

    // Handle 'size' field - ensure it's an array
    let sizeArray = [];
    if (size) {
      sizeArray = size.split(",").map(Number); // Convert to an array of numbers
    }

    // Create a new product
    const newProduct = new Product({
      name,
      model,
      price,
      originalPrice,
      color,
      size: sizeArray, // Store array of sizes
      barcode,
      availability,
      description,
    });

    // Handle the uploaded image (only if a new image is uploaded)
    if (req.file) {
      newProduct.imageUrls = `/uploads/${req.file.filename}`; // Store relative path to image in the uploads folder
    }

    // Save the new product to the database
    await newProduct.save();

    // Redirect to the product list or another page after creating the product
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).send("Error creating product");
  }
});





// Route to view all products (GET)
// Route to view all products with pagination and search (GET)
router.get("/admin/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
    const limit = 5; // Number of products per page
    const skip = (page - 1) * limit; // Calculate how many products to skip based on the current page
    const searchQuery = req.query.search || ""; // Get the search query from the query string

    // Create a filter for the search query
    const filter = searchQuery
      ? { name: { $regex: searchQuery, $options: "i" } } // Case-insensitive search
      : {};

    // Fetch products matching the search query with pagination
    const products = await Product.find(filter).skip(skip).limit(limit);

    // Get the total number of products matching the search query to calculate total pages
    const totalCount = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Render the admin products page with pagination and search data
    res.render("admin/products", {
      layout: "adminlayout",
      pageTitle: "Manage Your Products",
      products,
      currentPage: page,
      totalPages,
      searchQuery, // Pass the search query back to the template
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Error fetching products");
  }
});


// Serve static files (images) from 'uploads' folder
router.use('/uploads', express.static('uploads'));

module.exports = router;
