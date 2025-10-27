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
    parentCategory: {
        type: String,
        required: false,  // Not required for backward compatibility
        index: true,  // For faster filtering
        default: 'Chưa phân loại'
    },
    subcategory: {
        type: String,
        required: false,  // Not required for backward compatibility
        index: true,
        default: 'Chưa phân loại'
    },
    // Keep old 'category' field for backward compatibility (optional)
    category: {
        type: String,
        required: false
    },
    unit: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false,
        default: null
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