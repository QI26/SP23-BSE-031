const express = require("express");
const mongoose = require("mongoose");
var expressLayouts = require("express-ejs-layouts");

let server = express();
server.set("view engine", "ejs");
server.use(expressLayouts);

server.use(express.static("public"));
server.use(express.urlencoded());

let adminProductsRouter = require("./routes/admin/products.controller");
server.use(adminProductsRouter);

let adminCategoriesRouter = require("./routes/admin/categories.controller")
server.use(adminCategoriesRouter);
server.get("/", async (req, res) => {
  let Product = require("./models/product.model");
  let products = await Product.find();
  let Category = require("./models/category.model");
  let categories = await Category.find();

  return res.render("bootStrapHomePage", { products , categories});
});

let connectionString = "mongodb://localhost/sp23-bse-031";
mongoose
  .connect(connectionString, { useNewUrlParser: true })
  .then(() => console.log("Connected to Mongo DB Server: " + connectionString))
  .catch((error) => console.log(error.message));

server.listen(4500, () => {
  console.log(`Server Started at localhost:4500`);
});
