const express = require("express");
const mongoose = require("mongoose");
var expressLayouts = require("express-ejs-layouts");
let server = express();
server.set("view engine", "ejs");
server.use(expressLayouts);

// Serve static files from 'public' and 'uploads' directories
server.use(express.static("public"));
server.use("/uploads", express.static("uploads"));  // Serve the uploads directory

server.use(express.urlencoded());

// Import models
let Product = require("./models/product.model");  // Ensure it's required here
let Category = require("./models/category.model");  // Same here

// Routes
let adminProductsRouter = require("./routes/admin/products.controller");
server.use(adminProductsRouter);

let adminCategoriesRouter = require("./routes/admin/categories.controller");
server.use(adminCategoriesRouter);

const productsRouter = require("./routes/products");
server.use("/products", productsRouter);

// Route to fetch products
server.get('/products', (req, res) => {
    // Fetch products from the database
    Product.find({}, (err, products) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching products');
        }
        // Pass the products to the EJS template
        res.render('products', { products: products });
    });
});

// Home page route
server.get("/", async (req, res) => {
    // Fetch products and categories for the home page
    let products = await Product.find();
    let categories = await Category.find();

    return res.render("bootStrapHomePage", { products, categories });
});

// MongoDB connection
let connectionString = "mongodb://localhost/sp23-bse-031";
mongoose
  .connect(connectionString, { useNewUrlParser: true })
  .then(() => console.log("Connected to Mongo DB Server: " + connectionString))
  .catch((error) => console.log(error.message));

// Start the server
server.listen(4500, () => {
  console.log(`Server Started at localhost:4500`);
});
