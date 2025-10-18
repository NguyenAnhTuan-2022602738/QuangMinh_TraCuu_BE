const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Make sure customerController is properly loaded
console.log('Available controller methods:', Object.keys(customerController));

// Use a temporary inline function if needed
router.get('/', (req, res) => {
  try {
    // Try to call the controller method if it exists
    if (customerController.getAllCustomers) {
      return customerController.getAllCustomers(req, res);
    }
    // Fallback response
    res.json({ message: 'Customer API is working' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Other routes
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.addCustomer);

module.exports = router;