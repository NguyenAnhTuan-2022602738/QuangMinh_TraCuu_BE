const express = require('express');
const { register, login, adminLogin } = require('../controllers/authController');
const router = express.Router();

// Route for admin login
router.post('/admin-login', adminLogin);

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);

module.exports = router;