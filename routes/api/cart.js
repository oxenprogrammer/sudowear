const express = require("express");
const { check, validationResult } = require("express-validator");
const Router = express.Router();

const User = require("./../../models/User");
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
Router.post("/:id", [[checkItem, checkQuantity], auth], async (req, res) => {
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

module.exports = Router;
