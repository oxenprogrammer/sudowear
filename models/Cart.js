const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  quantity: { type: Number, min: 1 },
});

module.exports = CartSchema;
