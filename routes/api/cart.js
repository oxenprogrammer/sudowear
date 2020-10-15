const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();

const User = require("./../../models/User");
const Product = require('./../../models/Product');
const auth = require("./../../middlewares/auth");


// @route    POST api/cart/:id
// @desc     Add to Cart route
// @access   Private
// const checkProducts = check('products', 'Array required').not().isEmpty();
const checkItem = check(
  "item",
  "Please select T-Shirt to purchase"
).isMongoId();
const checkQuantity = check(
  "quantity",
  "Please specify the number of T-Shirts"
).isNumeric();
router.post("/:id", [[checkItem, checkQuantity], auth], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const userId = req.user.id;
  const paramId = req.params.id;
  console.log("userId", userId, "\n", "paramId", paramId);
  if (paramId !== userId) {
    return res.status(403).json({
      errors: [
        {
          msg: `Unauthorized Operation. FORBIDDEN`,
        },
      ],
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      paramId,
      { $push: { cart: req.body } },
      { new: true }
    );
    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Something went wrong" }] });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server error occurred");
  }
});

// @route    PUT api/cart/:id?itemId=string&quantity=number
// @desc     Add to Cart route
// @access   Private
router.put("/:id", [auth], async (req, res) => {
  const userId = req.user.id;
  const paramId = req.params.id;
  if (paramId !== userId) {
    return res.status(403).json({
      errors: [
        {
          msg: `Unauthorized Operation. FORBIDDEN`,
        },
      ],
    });
  }

  try {
    let user = await User.findById(paramId);

    let quantity = req.query.quantity / 1 || 1;
    let foundItem = -1;

    for (const [index, item] of user.cart.entries()) {
      console.log("%d: %s", index, item);
      if (item.item.toString() === req.query.itemId) {
        console.log("match found");
        foundItem = index;
        console.log("foundItem", foundItem);
      }
    }

    if (foundItem >= 0) {
      console.log("Found Item = " + foundItem);
      if (quantity === 0) {
        user.cart.splice(foundItem, 1);
      } else {
        user.cart[foundItem].quantity = quantity;
      }
    }
    await user.save();
    return res.json({ user });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server error occurred");
  }
});

// @route    GET api/cart/:id
// @desc     Get from Cart route
// @access   Private
router.get("/:id", [auth], async (req, res) => {
  const userId = req.user.id;
  const paramId = req.params.id;
  if (paramId !== userId) {
    return res.status(403).json({
      errors: [
        {
          msg: `Unauthorized Operation. FORBIDDEN`,
        },
      ],
    });
  }
  try {
    const user = await User.findById(paramId).cache({ expire: 10 });;
    let carts = [];
    let products = user.cart;
    for (let [index, product] of products.entries()) { 
      const { item, quantity } = product;
      const cart = await Product.findById(item).cache({ expire: 10 });;
      cart['quantity'] = quantity;
      cart['price'] = parseInt(cart['price'], 10) * quantity;
      carts.push(cart);
    }

    return res.json({ carts });
  
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server error occurred");
  }
});

module.exports = router;
