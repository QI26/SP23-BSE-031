const express = require("express");
let router = express.Router();

router.get("/admin/products", (req, res) => {
  let products = [
    {
      title: "IPhone",
      price: "One Kidney",
      description: "Sweet Dreams",
      _id: 1,
    },
    {
      title: "Nokia",
      price: "Half Kidney",
      description: "Sweet Dreams/2",
      _id: 1,
    },
  ];
  return res.render("admin/products", {
    layout: "adminlayout",
    pageTitle: "Manage Your Products",
    products,
  });
});

module.exports = router;