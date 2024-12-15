const express = require("express");
const router = express.Router();
let Product = require("../models/product.model");

// Route to render the products page
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
        const limit = 4; // Number of products per page
        const skip = (page - 1) * limit; // Calculate how many products to skip based on the current page
        const searchQuery = req.query.search || ""; // Get the search query from the query string

        // Create a filter for the search query
        const filter = searchQuery
            ? { name: { $regex: searchQuery, $options: "i" } } // Case-insensitive search
            : {};

        // Fetch products matching the search query with pagination
        let products = await Product.find(filter).skip(skip).limit(limit);

        // Get the total number of products matching the search query to calculate total pages
        const totalCount = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);

        res.render("products", {
            title: "Products Page",
            products,
            currentPage: page,
            totalPages: totalPages,
            searchQuery, // Pass the search query back to the template
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching products");
    }
});



module.exports = router;
