const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    desc: {
        type: Text,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    added: {
        type: Date,
        default: Date.now
    }
});

module.exports = Product = mongoose.model('product', ProductSchema);