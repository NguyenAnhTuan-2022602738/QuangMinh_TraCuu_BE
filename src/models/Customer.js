const mongoose = require('mongoose');

// Customer schema now supports authentication for customer accounts created by admin
const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    // username used for login (we'll use phone as username)
    username: {
        type: String,
        required: true,
        unique: true,
    },
    // hashed password
    passwordHash: {
        type: String,
    },
    // which price types this account is allowed to access (e.g. ['BBPT', 'BL'])
    allowedPriceTypes: {
        type: [String],
        default: [],
    },
    // legacy fields
    email: {
        type: String,
    },
    customerType: {
        type: String,
        enum: ['regular', 'premium', 'wholesale'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Customer', customerSchema);