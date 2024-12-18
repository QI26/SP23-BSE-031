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
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 15 }
}));

server.use(async (req, res, next) => {
  res.locals.isLoggedIn = req.session.user ? true : false;
  res.locals.user = req.session.user || null;
  next();
});

server.use(flash());
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
    const products = await Product.find();
    const categories = await Category.find();
    const users = await UserModel.find();
    res.render("bootStrapHomePage", { products, categories, users });
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
server.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user;
      return res.redirect("/");
    }
    req.flash("error", "Invalid credentials. Please try again.");
    res.redirect("/login");
  } catch (error) {
    console.error("Error during login:", error.message);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect("/login");
  }
});

// GET: Register Page
server.get("/register", (req, res) => {
  res.render("auth/register");
});

// POST: Register Route
server.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      req.flash("error", "User already exists. Try again.");
      return res.redirect("/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ name, email, password: hashedPassword });
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
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.send("Error logging out.");
    }
    res.clearCookie("cart");
    res.clearCookie("connect.sid");
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

server.post("/cart/add/:id", isAuthenticated, (req, res) => {
  const productId = req.params.id;
  let cart = req.cookies.cart || [];

  if (!cart.includes(productId)) cart.push(productId);
  res.cookie("cart", cart);
  res.redirect("/products");
});

server.post("/cart/remove/:id", isAuthenticated, (req, res) => {
  const productId = req.params.id;
  let cart = req.cookies.cart || [];
  cart = cart.filter(id => id !== productId);
  res.cookie("cart", cart);
  res.redirect("/cart");
});

server.get("/cart", isAuthenticated, async (req, res) => {
  let cart = req.cookies.cart || [];
  const validCart = cart.filter(id => mongoose.isValidObjectId(id));

  try {
    const products = await Product.find({ _id: { $in: validCart } });
    res.render("cart", { products, message: null });
  } catch (err) {
    console.error("Error fetching cart products:", err.message);
    return res.status(500).send("Internal Server Error");
  }
});

// Checkout route
server.get("/checkout", isAuthenticated, (req, res) => {
  let cart = req.cookies.cart || [];
  if (cart.length === 0) return res.redirect("/cart");

  Product.find({ _id: { $in: cart } })
    .then((products) => {
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
    const validCart = cart.filter(id => mongoose.isValidObjectId(id));
    const productsInCart = await Product.find({ _id: { $in: validCart } });

    let totalAmount = 0;
    const orderProducts = productsInCart.map(product => {
      const quantity = cart.filter(id => id.toString() === product._id.toString()).length;
      totalAmount += product.price * quantity;

      return {
        productId: product._id,
        quantity,
        price: product.price
      };
    });

    const newOrder = new Order({
      customerId: req.session.user._id,
      products: orderProducts,
      totalAmount,
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

// GET: Order Confirmation Page
server.get("/confirmation", (req, res) => {
  res.render("Confirmation");
});

// Start Server
server.listen(4500, () => {
  console.log(`Server running at http://localhost:4500`);
});
