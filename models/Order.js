const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  products: [],
  totalPrice: {
    type: Number,
    required: true
  },
  orderDate: {
    type: Date,
    default: new Date(),
  },
});

module.exports = Order = mongoose.model("order", OrderSchema);
