const express = require("express");
const multer = require("multer");
let router = express.Router();
let Product = require("../../models/product.model");
let Category = require("../../models/category.model");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const isAdmin = require("../../middlewares/admin-middleware");

router.get("/admin/products", isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || "";
    const categoryFilter = req.query.category || "";
    const sortQuery = req.query.sort || "";

    const filter = {};
    if (searchQuery) {
      filter.name = { $regex: searchQuery, $options: "i" };
    }

    if (categoryFilter) {
      const category = await Category.findOne({ title: categoryFilter });
      if (category) {
        filter.categoryId = category._id;
      }
    }

    let sort = {};
    if (sortQuery === "priceLow") {
      sort.price = 1;
    } else if (sortQuery === "priceHigh") {
      sort.price = -1;
    } else if (sortQuery === "asc") {
      sort.name = 1;
    } else if (sortQuery === "desc") {
      sort.name = -1;
    }

    const products = await Product.find(filter)
      .populate("categoryId", "title")
      .skip(skip)
      .limit(limit)
      .sort(sort);

    const totalCount = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    const categories = await Category.find();

    res.render("admin/products", {
      layout: "adminlayout",
      pageTitle: "Manage Your Products",
      products,
      currentPage: page,
      totalPages,
      searchQuery,
      categories,
      selectedCategory: categoryFilter,
      selectedSort: sortQuery,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Error fetching products");
  }
});

router.get("/admin/products/create", async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("admin/product-form", {
      layout: "adminlayout",
      categories,
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories");
  }
});

router.post("/admin/products/create", upload.single("image"), async (req, res) => {
  try {
    const { name, model, price, originalPrice, color, size, barcode, availability, description, categoryId } = req.body;

    let sizeArray = [];
    if (size) {
      sizeArray = size.split(",").map(Number);
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
      categoryId,
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

router.get("/admin/products/create", async (req, res) => {
  try {
    const categories = await Category.find();
    res.render('admin/createProduct', { categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories");
  }
});

router.get("/admin/products/edit/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const categories = await Category.find();
    res.render("admin/product-edit-form", { product, categories , layout: "adminlayout"});
  } catch (err) {
    console.error("Error fetching product or categories:", err);
    res.status(500).send("Error fetching product or categories");
  }
});

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
    product.categoryId = categoryId;

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

router.get("/admin/products/delete/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Error deleting product");
  }
});

router.use('/uploads', express.static('uploads'));

module.exports = router;
