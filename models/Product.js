const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    desc: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    images: [{
        type: String,
        required: true
    }],
    isAvailable: {
        type: Boolean,
        default: true
    },
    added: {
        type: Date,
        default: Date.now
    }
});

module.exports = Product = mongoose.model('product', ProductSchema);