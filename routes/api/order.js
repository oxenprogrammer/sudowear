const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const Order = require("./../../models/Order");
const User = require("./../../models/User");
const Product = require("./../../models/Product");
const auth = require("./../../middlewares/auth");

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
      products['quantity'] = quantity;
      const price = parseInt(products['price'], 10) * quantity;
      products['price'] = price;
      totalPrice = totalPrice + price;
      console.log("products", products);
      order.products = products;
      orders.push(order);
    }
    
    let newOrder = new Order({
        products: orders,
        totalPrice,
        userId
    });
     // save order to db
    await newOrder.save();

     // empty the cart
     user.cart = [];

     // add user order to their order property
    const orderid = user['orders'] = mongoose.Types.ObjectId(newOrder._id);
    user.update({$push: {orders: orderid }});
    await user.save();

    return res.status(201).json({ newOrder });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server error occurred");
  }
});

module.exports = router;
