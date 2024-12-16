const express = require("express");
const router = express.Router();
let Product = require("../models/product.model");
let Category = require("../models/category.model")

// Route to render the products page
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
        const limit = 4; // Number of products per page
        const skip = (page - 1) * limit; // Calculate how many products to skip based on the current page
        const searchQuery = req.query.search || ""; // Get the search query from the query string
        const categoryFilter = req.query.category || ""; // Get the category filter from the query string
        const sortQuery = req.query.sort || ""; // Get the sorting query from the query string

        // Construct filter object for search and category
        const filter = {};

        if (searchQuery) {
            filter.name = { $regex: searchQuery, $options: "i" }; // Case-insensitive search by name
        }

        if (categoryFilter) {
            const category = await Category.findOne({ title: categoryFilter });
            if (category) {
                filter.categoryId = category._id; // Match categoryId in products
            } else {
                console.log(`No category found for title: ${categoryFilter}`);
                filter.categoryId = null;
            }
        }

        // Construct sort object based on sort query
        let sort = {}; // Initialize an empty sort object

        if (sortQuery === "priceLow") {
            sort.price = 1; // Price Low to High (ascending order)
        } else if (sortQuery === "priceHigh") {
            sort.price = -1; // Price High to Low (descending order)
        } else if (sortQuery === "asc") {
            sort.name = 1; // Alphabetical A to Z (ascending order)
        } else if (sortQuery === "desc") {
            sort.name = -1; // Alphabetical Z to A (descending order)
        }

        console.log("Constructed Filter:", filter);
        console.log("Sort:", sort);

        // Fetch products based on the filter with pagination and sorting
        const products = await Product.find(filter).skip(skip).limit(limit).sort(sort);

        // Get the total number of products matching the filter to calculate total pages
        const totalCount = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);

        // Fetch all categories for the category filter dropdown
        const categories = await Category.find();

        // Send the data to the view
        res.render("products", {
            title: "Products Page",
            products,
            currentPage: page,
            totalPages: totalPages,
            searchQuery,
            categories,
            selectedCategory: categoryFilter,
            selectedSort: sortQuery // Keep track of the selected sort option
        });
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).send("Error fetching products");
    }
});


module.exports = router;
