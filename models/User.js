const mongoose = require("mongoose");
const cart = require("./Cart");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["ADMIN", "CLIENT"],
    default: "CLIENT",
  },
  avatar: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  cart: [cart],
  order: [],
});

module.exports = User = mongoose.model("user", UserSchema);
