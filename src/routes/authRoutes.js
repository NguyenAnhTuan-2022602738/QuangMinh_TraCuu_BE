
const express = require('express');
const { adminLogin, createCustomerAccount, customerLogin, listCustomers, updateCustomer, deleteCustomer, resetCustomerPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth'); // admin auth middleware
const router = express.Router();

// Admin login
router.post('/admin-login', adminLogin);

// Admin creates a customer account (protected by admin token)
router.post('/admin/create-customer', authMiddleware, createCustomerAccount);
// Admin customer management
router.get('/admin/customers', authMiddleware, listCustomers);
router.put('/admin/customers/:id', authMiddleware, updateCustomer);
router.delete('/admin/customers/:id', authMiddleware, deleteCustomer);
router.post('/admin/customers/:id/reset-password', authMiddleware, resetCustomerPassword);

// Customer login
router.post('/customer-login', customerLogin);

// NOTE: legacy /register and /login routes are no longer used by the app but kept for compatibility if needed

module.exports = router;