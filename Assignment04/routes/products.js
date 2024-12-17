const express = require("express");
const router = express.Router();
let Product = require("../models/product.model");
let Category = require("../models/category.model");

// Route to render the products page (with pagination, search, and filtering)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
    const limit = 4; // Number of products per page
    const skip = (page - 1) * limit; // Skip products based on the current page
    const searchQuery = req.query.search || ""; // Get the search query from the query string
    const categoryFilter = req.query.category || ""; // Get the category filter
    const sortQuery = req.query.sort || ""; // Get the sort query

    // Construct filter object for search and category
    const filter = {};

    if (searchQuery) {
      filter.name = { $regex: searchQuery, $options: "i" }; // Case-insensitive search by name
    }

    if (categoryFilter) {
      const category = await Category.findOne({ title: categoryFilter });
      if (category) {
        filter.categoryId = category._id; // Filter products by categoryId
      } else {
        console.log(`No category found for title: ${categoryFilter}`);
        filter.categoryId = null; // If category not found, set to null
      }
    }

    // Sort products based on the query parameter
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

    // Fetch products with pagination and sorting
    const products = await Product.find(filter).skip(skip).limit(limit).sort(sort);

    // Calculate the total number of pages
    const totalCount = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch categories for filtering
    const categories = await Category.find();

    // Render the products page
    res.render("products", {
      title: "Products Page",
      products,
      currentPage: page,
      totalPages: totalPages,
      searchQuery,
      categories,
      selectedCategory: categoryFilter,
      selectedSort: sortQuery, // Keep track of the selected sort option
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Error fetching products");
  }
});

// Route to show individual product details
router.get("/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    // Fetch product details and populate category information
    const product = await Product.findById(productId).populate("categoryId");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Render the product details page with the fetched product data
    res.render("productDetails", { product });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching product details");
  }
});

module.exports = router;
