const mongoose = require("mongoose");
const productSchema = require("./Product");

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  products: [
    {
      item: productSchema,
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  ],
  orderDate: {
    type: Date,
    default: new Date(),
  },
});

module.exports = Order = mongoose.model("order", OrderSchema);
