// This file contains functions to handle customer-related API requests. 

const Customer = require('../models/Customer');
const PriceMatrix = require('../models/PriceMatrix');

// Get customer details by ID
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get price for a specific product based on customer type
exports.getProductPriceForCustomer = async (req, res) => {
    const { productId, customerType } = req.params;

    try {
        const priceMatrix = await PriceMatrix.findOne({ productId, customerType });
        if (!priceMatrix) {
            return res.status(404).json({ message: 'Price not found for this customer type' });
        }
        res.json({ price: priceMatrix.price });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Add a new customer
exports.addCustomer = async (req, res) => {
    const newCustomer = new Customer(req.body);
    try {
        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        res.status(400).json({ message: 'Error adding customer', error });
    }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};