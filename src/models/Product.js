const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    prices: {
        BBCL: {
            type: Number,
            required: true
        },
        BBPT: {
            type: Number,
            required: true
        },
        BL: {
            type: Number,
            required: true
        },
        BLVIP: {
            type: Number,
            required: true
        },
        honda247: {
            type: Number,
            required: true
        }
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;