const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

const Order = require("../../models/order.model");
mongoose.set('strictPopulate', false);

router.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId')
      .populate('products.productId');

    res.render("admin/orders", { layout: "adminlayout", orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Server Error");
  }
});

router.post("/admin/orders/cancel/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'Cancelled' },
      { new: true }
    );

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.redirect("/admin/orders");
  } catch (err) {
    console.error("Error canceling order:", err);
    res.status(500).send("Server Error");
  }
});

router.post("/admin/orders/delete/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).send("Order not found");
    }

    res.redirect("/admin/orders");
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
