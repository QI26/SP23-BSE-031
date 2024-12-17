const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Order Schema definition
const OrderSchema = new Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Assuming a User model exists for customers
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'Cash on Delivery',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Shipped', 'Delivered'],
        default: 'Pending',
        required: true
    },
    datePlaced: {
        type: Date,
        default: Date.now
    }
});

// Create the Order model
const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;

