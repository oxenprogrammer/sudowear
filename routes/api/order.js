const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Order = require("./../../models/Order");
const User = require("./../../models/User");
const Product = require("./../../models/Product");
const auth = require("./../../middlewares/auth");
const ROLE = require("./../../middlewares/roles");
require("dotenv").config();

// add order
router.post("/", [auth], async (req, res) => {
  const userId = req.user.id;

  try {
    let user = await User.findById(userId);
    let order = {};
    let orders = [];
    let carts = user.cart;
    let totalPrice = 0;

    for (let cart of carts) {
      const { item, quantity } = cart;
      let products = await Product.findById(item);
      products["quantity"] = quantity;
      const price = parseInt(products["price"], 10) * quantity;
      products["price"] = price;
      totalPrice = totalPrice + price;
      order.products = products;
      orders.push(order);
    }

    let newOrder = new Order({
      products: orders,
      totalPrice,
      userId,
    });
    // save order to db
    await newOrder.save();

    // empty the cart
    user.cart = [];

    // add user order to their order property
    const orderid = (user["orders"] = mongoose.Types.ObjectId(newOrder._id));
    user.update({ $push: { orders: orderid } });
    await user.save();

    return res.status(201).json({ newOrder });
  } catch (error) {
    return res.status(500).send("Server error occurred");
  }
});

// get your own order
router.get("/", [auth], async (req, res) => {
  const userId = req.user.id;
  try {
    const order = await Order.find({ userId }).cache({ expire: 10 });
    return res.status(200).json({ order });
  } catch (error) {
    return res.status(500).send("Server error occurred");
  }
});

// get your own order
router.get("/all", [auth, ROLE("ADMIN")], async (req, res) => {
  try {
    const orders = await Order.find().cache({ expire: 10 });
    let total = 0;
    for (let order of orders) {
      const { totalPrice } = order;
      total = total + totalPrice;
    }
    return res.status(200).json({ orders, grandTotalPrice: total });
  } catch (error) {
    return res.status(500).send("Server error occurred");
  }
});

module.exports = router;
