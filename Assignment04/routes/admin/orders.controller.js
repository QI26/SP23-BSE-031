const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

const Order = require("../../models/order.model"); // Import your Order model
mongoose.set('strictPopulate', false);

// Fetch orders for the admin panel
router.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId') // Populate the customerId field with user details
      .populate('products.productId'); // Populate the productId inside the products array

    res.render("admin/orders", { layout: "adminlayout",orders }); // Pass orders to your EJS template
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Server Error");
  }
});

// Cancel an order
router.post("/admin/orders/cancel/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    // Find the order by ID and update its status to 'Cancelled'
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'Cancelled' },
      { new: true } // Return the updated order
    );

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Redirect to the orders page after canceling the order
    res.redirect("/admin/orders");
  } catch (err) {
    console.error("Error canceling order:", err);
    res.status(500).send("Server Error");
  }
});

router.post("/admin/orders/delete/:orderId", async (req, res) => {
    const { orderId } = req.params;
  
    try {
      // Find and delete the order by its ID
      const deletedOrder = await Order.findByIdAndDelete(orderId);
  
      if (!deletedOrder) {
        return res.status(404).send("Order not found");
      }
  
      // Redirect to the orders page after deleting the order
      res.redirect("/admin/orders");
    } catch (err) {
      console.error("Error deleting order:", err);
      res.status(500).send("Server Error");
    }
  });
  

module.exports = router;
