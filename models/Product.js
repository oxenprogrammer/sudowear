const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  desc: {
    type: String,
    required: true,
  },
  size: [
    {
      type: String,
      enum: ["XS", "S", "L", "XL", "XXL"],
      default: ["S", "L", "XL"],
    }
  ],
  price: {
    type: String,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  images: [
    {
      type: String,
      required: true,
    },
  ],
  isAvailable: {
    type: Boolean,
    default: true,
  },
  added: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Product = mongoose.model("product", ProductSchema);
