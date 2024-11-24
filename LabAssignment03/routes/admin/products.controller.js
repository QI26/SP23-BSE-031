const express = require("express");
let router = express.Router();
let Product = require("../../models/product.model");

// route to handle Delete of product
router.get("/admin/products/delete/:id", async (req, res) => {
  let params = req.params;
  let product = await Product.findByIdAndDelete(req.params.id);
  // let query = req.query;
  // return res.send({ query, params });
  // return res.send(product);
  return res.redirect("/admin/products");
});

//route to render edit product form
router.get("/admin/products/edit/:id", async (req, res) => {
  let product = await Product.findById(req.params.id);
  return res.render("admin/product-edit-form", {
    layout: "adminlayout",
    product,
  });
});
router.post("/admin/products/edit/:id", async (req, res) => {
  let product = await Product.findById(req.params.id);
  product.title = req.body.title;
  product.description = req.body.description;
  product.price = req.body.price;
  await product.save();
  return res.redirect("/admin/products");
});

// route to render create product form
router.get("/admin/products/create", (req, res) => {
  return res.render("admin/product-form", { layout: "adminlayout" });
});

//route to handle create product form submission
// demonstrates PRG Design Pattern (Post Redirect GET)
router.post("/admin/products/create", async (req, res) => {
  let data = req.body;
  let newProduct = new Product(data);
  newProduct.title = data.title;
  await newProduct.save();
  return res.redirect("/admin/products");
  // we will send data to model to save in db

  // return res.send(newProduct);
  // return res.render("admin/product-form", { layout: "adminlayout" });
});

router.get("/admin/products", async (req, res) => {
  let products = await Product.find();
  return res.render("admin/products", {
    layout: "adminlayout",
    pageTitle: "Manage Your Products",
    products,
  });
});

module.exports = router;