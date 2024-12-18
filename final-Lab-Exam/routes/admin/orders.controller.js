const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

const Order = require("../../models/order.model");
mongoose.set('strictPopulate', false);

router.get('/admin/orders', async (req, res) => {
  try {
      // Fetch orders sorted by datePlaced in descending order
      const orders = await Order.find()
          .populate('customerId', 'name') // Populate customer name
          .populate('products.productId', 'name') // Populate product name
          .sort({ datePlaced: -1 }); // Sort by datePlaced in descending order

      res.render('admin/orders', { orders , layout : "adminlayout" });
  } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving orders.');
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

router.post('/admin/orders/update-status/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Validate and update status
    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).send('Invalid status');
    }

    await Order.findByIdAndUpdate(id, { status });
    res.redirect('/admin/orders');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
