const express = require("express");
const router = express.Router();
let Product = require("../models/product.model");
let Category = require("../models/category.model");

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
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
      } else {
        filter.categoryId = null;
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

    const products = await Product.find(filter).skip(skip).limit(limit).sort(sort);

    const totalCount = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    const categories = await Category.find();

    res.render("products", {
      title: "Products Page",
      products,
      currentPage: page,
      totalPages: totalPages,
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

router.get("/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId).populate("categoryId");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render("productDetails", { product });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching product details");
  }
});

module.exports = router;
