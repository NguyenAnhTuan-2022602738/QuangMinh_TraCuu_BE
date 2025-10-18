const mongoose = require('mongoose');

const PriceMatrixSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    customerType: {
        type: String,
        enum: ['retail', 'wholesale', 'distributor'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    effectiveDate: {
        type: Date,
        default: Date.now
    }
});

const PriceMatrix = mongoose.model('PriceMatrix', PriceMatrixSchema);

module.exports = PriceMatrix;