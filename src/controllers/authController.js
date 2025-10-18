// This file contains functions to handle authentication-related API requests.

const User = require('../models/Customer'); // Assuming User model is defined in models/Customer.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mật khẩu admin mặc định (nên đổi trong production)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Admin login
exports.adminLogin = async (req, res) => {
    const { password } = req.body;

    try {
        // Kiểm tra mật khẩu admin
        if (password === ADMIN_PASSWORD) {
            // Tạo JWT token - chỉ cần xác nhận đã xác thực thành công, không cần thêm role
            const token = jwt.sign(
                { isAuthenticated: true }, 
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            
            res.status(200).json({ 
                token,
                message: 'Đăng nhập thành công' 
            });
        } else {
            res.status(401).json({ message: 'Mật khẩu không đúng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Register a new user
exports.register = async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};

// Login user
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

// Middleware to authenticate user
exports.authenticate = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.userId = decoded.id;
        next();
    });
};