const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const flash = require("connect-flash");
const cookieParser = require('cookie-parser');


// Middleware
const isAuthenticated = require("./middlewares/auth-middleware");

// Models
let Product = require("./models/product.model");
let Category = require("./models/category.model");
const UserModel = require("./models/user.model");
const Order = require('./models/order.model');
const server = express();
server.set("view engine", "ejs");
server.use(expressLayouts);
server.use(cookieParser());
// Static Files
server.use(express.static("public"));
server.use("/uploads", express.static("uploads"));

// Middleware
server.use(express.urlencoded({ extended: true }));
server.use(session({
  secret: 'your-secret-key',  // Secret to sign session ID cookie
  resave: false,              // Don't save session if unmodified
  saveUninitialized: false,   // Don't save empty sessions
  cookie: { maxAge: 1000 * 60 * 15 } // Session expires in 15 minutes
}));
// Session Middleware
server.use(
  session({
    secret: "your-secret-key", // Use a secure string
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 15 }, // 15-minute session expiry
  })
);
server.use(async (req, res, next) => {
  res.locals.isLoggedIn = req.session.user ? true : false;
  res.locals.user = req.session.user || null;
  next();
});

// Configure connect-flash middleware
server.use(flash());

// Middleware to make flash messages available in views
server.use((req, res, next) => {
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  next();
});
// MongoDB Connection
const connectionString = "mongodb://localhost/sp23-bse-031";
mongoose
  .connect(connectionString, { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.log(error.message));

// Routes for Products
const adminProductsRouter = require("./routes/admin/products.controller");
server.use(adminProductsRouter);

const adminCategoriesRouter = require("./routes/admin/categories.controller");
server.use(adminCategoriesRouter);

const orderRouter = require("./routes/admin/orders.controller");
server.use(orderRouter);

const productsRouter = require("./routes/products");
server.use("/products", productsRouter);

// Home Page Route
server.get("/", async (req, res) => {
  try {
    // Fetch products, categories, and users from the database
    const products = await Product.find();
    const categories = await Category.find();
    const users = await UserModel.find(); // If you need to pass user data (adjust accordingly)

    // Render the 'bootStrapHomePage' template with the fetched data and the request object
    res.render("bootStrapHomePage", { 
      products, 
      categories, 
      users, // Pass the users data to the view if required
    });
  } catch (err) {
    console.error("Error fetching data:", err.message);
    res.status(500).send("Internal Server Error");
  }
});


// GET: Login Page
server.get("/login", (req, res) => {
  res.render("auth/login");
});

// POST: Login Route
// POST: Login Route
server.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        req.session.user = user; // Store user in session
        return res.redirect("/");
      }
    }
    // Add flash message for invalid credentials
    req.flash("error", "Invalid credentials. Please try again.");
    res.redirect("/login");
  } catch (error) {
    console.error("Error during login:", error.message);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect("/login");
  }
});

// GET: Register Page (Public Route)
server.get("/register", (req, res) => {
  res.render("auth/register");
});

// POST: Register Route
server.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      req.flash("error", "User already exists. Try again.");
      return res.redirect("/register");
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save new user
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    req.flash("success", "Registration successful! Please login.");
    res.redirect("/login");
  } catch (error) {
    console.error("Error during registration:", error.message);
    req.flash("error", "Internal Server Error. Please try again later.");
    res.redirect("/register");
  }
});



// GET: Logout
server.get("/logout", (req, res) => {
  console.log("LOGGING OUT...");
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.send("Error logging out.");
    }
    // Clear the session cookie
    res.clearCookie("cart");  // Clear the cart cookie
    res.clearCookie("connect.sid"); // Default name for the session cookie
    res.redirect("/");
  });
});


// Products Page Route
server.get("/products", (req, res) => {
  Product.find({}, (err, products) => {
    if (err) return res.status(500).send("Error fetching products");
    res.render("products", { products });
  });
});



server.post("/cart/add/:id",isAuthenticated, (req, res) => {
  const productId = req.params.id; // Get the product ID from the URL

  // Retrieve the cart from cookies, or initialize it as an empty array
  let cart = req.cookies.cart || [];

  // Add the product ID to the cart if it's not already present
  if (!cart.includes(productId)) {
    cart.push(productId);
  }

  // Set the updated cart back into cookies
  res.cookie("cart", cart);

  console.log("Cart after adding product:", cart); // Debugging step
  res.redirect("/products"); // Redirect to the cart page
});


server.post("/cart/remove/:id",isAuthenticated, (req, res) => {
  const productId = req.params.id; // Get the product ID from the URL

  // Retrieve the cart from cookies, or initialize it as an empty array
  let cart = req.cookies.cart || [];

  // Filter out the product ID to remove it from the cart
  cart = cart.filter(id => id !== productId);

  // Update the cart cookie
  res.cookie("cart", cart);

  console.log("Cart after removing product:", cart); // Debugging step
  res.redirect("/cart"); // Redirect back to the cart page
});




server.get("/cart",isAuthenticated, async (req, res) => {
  let cart = req.cookies.cart || []; // Retrieve the cart from cookies, default to empty array

  // Validate MongoDB ObjectIDs to prevent invalid queries
  const validCart = cart.filter(id => mongoose.isValidObjectId(id));

  try {
    // Fetch the products corresponding to the IDs in the cart
    const products = await Product.find({ _id: { $in: validCart } });

    console.log("Products in cart:", products); // Debugging step
    return res.render("cart", { products, message: null });
  } catch (err) {
    console.error("Error fetching cart products:", err.message);
    return res.status(500).send("Internal Server Error");
  }
});

// Checkout route
server.get("/checkout", isAuthenticated, (req, res) => {
  // Get cart items from cookies
  let cart = req.cookies.cart || [];

  // If cart is empty, redirect to the cart page
  if (cart.length === 0) {
    return res.redirect("/cart");
  }

  // Fetch the products in the cart from the database
  Product.find({ _id: { $in: cart } })
    .then((products) => {
      // Render checkout page and pass products
      res.render("checkout", { products });
    })
    .catch((err) => {
      console.error("Error fetching products:", err);
      res.status(500).send("Internal Server Error");
    });
});

// POST: Handle Order Submission
server.post("/order", isAuthenticated, async (req, res) => {
  const { address, phoneNumber } = req.body;
  const cart = req.cookies.cart || [];

  if (!cart.length) {
    req.flash("error", "Your cart is empty.");
    return res.redirect("/cart");
  }

  try {
    // Validate MongoDB ObjectIDs
    const validCart = cart.filter(id => mongoose.isValidObjectId(id));
    console.log("Valid Cart:", validCart);

    // Fetch products
    const productsInCart = await Product.find({ _id: { $in: validCart } });
    console.log("Products in Cart:", productsInCart);

    let totalAmount = 0;

    const orderProducts = productsInCart.map(product => {
      const quantity = cart.filter(id => id.toString() === product._id.toString()).length;


      totalAmount += product.price * quantity;

      return {
        productId: product._id,
        quantity: quantity,
        price: product.price
      };
    });


    const newOrder = new Order({
      customerId: req.session.user._id,
      products: orderProducts,
      totalAmount: totalAmount,
      shippingAddress: address,
      paymentMethod: "Cash on Delivery",
      status: "Pending",
      datePlaced: Date.now()
    });

    await newOrder.save();
    res.clearCookie("cart");
    req.flash("success", "Your order has been placed successfully!");
    res.redirect("/confirmation");
  } catch (err) {
    console.error("Error placing the order:", err.message);
    req.flash("error", "Something went wrong while processing your order. Please try again.");
    res.redirect("/cart");
  }
});



// GET: Order Confirmation Page (optional)
server.get("/confirmation", (req, res) => {
  res.render("Confirmation"); // Render a confirmation view
});




// Start Server
server.listen(4500, () => {
  console.log(`Server running at http://localhost:4500`);
});
