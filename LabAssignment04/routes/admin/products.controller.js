const express = require("express");
const multer = require("multer");
let router = express.Router();
let Product = require("../../models/product.model");
let Category = require("../../models/category.model");
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

// Route to view all products (GET) with categories, search, and sorting functionality
router.get("/admin/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
    const limit = 5; // Number of products per page
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || "";
    const categoryFilter = req.query.category || ""; // Get the category filter from the query parameters
    const sortQuery = req.query.sort || ""; // Get the sort query parameter

    // Construct filter object for search and category
    const filter = {};
    if (searchQuery) {
      filter.name = { $regex: searchQuery, $options: "i" }; // Case-insensitive search by name
    }

    if (categoryFilter) {
      // Find the category by title to get its _id
      const category = await Category.findOne({ title: categoryFilter });
      if (category) {
        filter.categoryId = category._id; // Match categoryId in products
      } else {
        console.log(`No category found for title: ${categoryFilter}`);
        // Skip the filtering if no matching category is found
      }
    }

    // Determine the sorting order
    let sort = {};
    if (sortQuery === "priceLow") {
      sort.price = 1; // Price Low to High
    } else if (sortQuery === "priceHigh") {
      sort.price = -1; // Price High to Low
    } else if (sortQuery === "asc") {
      sort.name = 1; // Alphabetical A to Z
    } else if (sortQuery === "desc") {
      sort.name = -1; // Alphabetical Z to A
    }

    // Fetch products based on the filter and sort criteria
    const products = await Product.find(filter)
      .populate("categoryId", "title") // Populate category details
      .skip(skip)
      .limit(limit)
      .sort(sort);

    // Get total count for pagination
    const totalCount = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch all categories for the category filter dropdown
    const categories = await Category.find();

    res.render("admin/products", {
      layout: "adminlayout",
      pageTitle: "Manage Your Products",
      products,
      currentPage: page,
      totalPages,
      searchQuery,
      categories, // Pass categories to the view for the filter dropdown
      selectedCategory: categoryFilter, // Keep track of selected category
      selectedSort: sortQuery, // Keep track of selected sort option
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Error fetching products");
  }
});

// Route to render create product form
router.get("/admin/products/create", async (req, res) => {
  try {
    const categories = await Category.find(); // Fetch all categories
    res.render("admin/product-form", {
      layout: "adminlayout",
      categories,
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories");
  }
});

// Route to handle create product form submission (POST)
router.post("/admin/products/create", upload.single("image"), async (req, res) => {
  try {
    const { name, model, price, originalPrice, color, size, barcode, availability, description, categoryId } = req.body;

    let sizeArray = [];
    if (size) {
      sizeArray = size.split(",").map(Number); // Convert to an array of numbers
    }

    const newProduct = new Product({
      name,
      model,
      price,
      originalPrice,
      color,
      size: sizeArray,
      barcode,
      availability,
      description,
      categoryId, // Associate the product with a category
    });

    if (req.file) {
      newProduct.imageUrls = `/uploads/${req.file.filename}`;
    }

    await newProduct.save();
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).send("Error creating product");
  }
});

// Route to render edit product form
router.get("/admin/products/edit/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("categoryId");
    const categories = await Category.find();
    res.render("admin/product-edit-form", {
      layout: "adminlayout",
      product,
      categories,
    });
  } catch (err) {
    console.error("Error fetching product for editing:", err);
    res.status(500).send("Error fetching product for editing");
  }
});

// Route to handle editing a product (POST)
router.post("/admin/products/edit/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, model, price, originalPrice, color, size, barcode, availability, description, categoryId } = req.body;
    const productId = req.params.id;

    let sizeArray = [];
    if (size) {
      sizeArray = size.split(",").map(Number);
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    product.name = name;
    product.model = model;
    product.price = price;
    product.originalPrice = originalPrice;
    product.color = color;
    product.size = sizeArray;
    product.barcode = barcode;
    product.availability = availability;
    product.description = description;
    product.categoryId = categoryId; // Update category association

    if (req.file) {
      product.imageUrls = `/uploads/${req.file.filename}`;
    }

    await product.save();
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send("Error updating product");
  }
});

// Route to delete a product
router.get("/admin/products/delete/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Error deleting product");
  }
});

// Serve static files (images) from 'uploads' folder
router.use('/uploads', express.static('uploads'));

module.exports = router;
