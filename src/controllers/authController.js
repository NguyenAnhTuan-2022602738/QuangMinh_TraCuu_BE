// Authentication controller for admin and customer accounts
const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mật khẩu admin mặc định (nên đổi trong production)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Admin login - issues an admin token
exports.adminLogin = async (req, res) => {
    const { password } = req.body;

    try {
        if (password === ADMIN_PASSWORD) {
            const token = jwt.sign(
                { isAuthenticated: true, role: 'admin' },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.status(200).json({ token, message: 'Đăng nhập thành công' });
        } else {
            res.status(401).json({ message: 'Mật khẩu không đúng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin creates a customer account (username is phone, passwordHash saved, allowedPriceTypes specified)
exports.createCustomerAccount = async (req, res) => {
    try {
        // Admin protection is enforced in route via auth middleware
        const { name, phone, allowedPriceTypes } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone are required' });
        }

        const username = String(phone).trim();
        const last3 = username.slice(-3) || '000';
        // Remove diacritics from name and spaces to create simple temp password
        const rawName = String(name || '')
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, '')
            .toLowerCase();
        const rawPassword = `${rawName || 'user'}${last3}`;
        const passwordHash = await bcrypt.hash(rawPassword, 10);

        // Normalize allowed price types to uppercase and remove invalid/empty entries
        const normalizedAllowed = (Array.isArray(allowedPriceTypes) ? allowedPriceTypes : [String(allowedPriceTypes || '')])
            .map(s => String(s || '').toUpperCase().trim())
            .filter(s => ['BBCL','BBPT','BL','BLVIP','HONDA247'].includes(s));

        const newCustomer = new Customer({
            name,
            phone: username,
            username,
            passwordHash,
            allowedPriceTypes: normalizedAllowed,
        });

        await newCustomer.save();

        // Return the generated password (admin needs to send to user) - note: in production, avoid returning raw password
        res.status(201).json({
            message: 'Tạo tài khoản thành công',
            username,
            password: rawPassword,
            customer: {
                id: newCustomer._id,
                name: newCustomer.name,
                phone: newCustomer.phone,
                username: newCustomer.username,
                allowedPriceTypes: newCustomer.allowedPriceTypes,
                createdAt: newCustomer.createdAt
            }
        });
    } catch (error) {
        console.error('createCustomerAccount error:', error);
        if (error.code === 11000) {
            const keyPattern = Object.keys(error.keyPattern || {});
            const keyValue = Object.keys(error.keyValue || {});
            const field = keyValue[0] || keyPattern[0] || 'phone';
            return res.status(409).json({
                message: field === 'email'
                    ? 'Email đã tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc cập nhật khách hàng cũ.'
                    : 'Tài khoản đã tồn tại',
                field,
            });
        }
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Customer login - returns JWT containing allowedPriceTypes claim
exports.customerLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await Customer.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Tài khoản không tồn tại' });

        const isMatch = await bcrypt.compare(password, user.passwordHash || '');
        if (!isMatch) return res.status(401).json({ message: 'Mật khẩu không đúng' });

        // Normalize allowedPriceTypes for safety
        const allowed = (user.allowedPriceTypes || []).map(s => String(s).toUpperCase());
        const token = jwt.sign(
            { id: user._id, username: user.username, allowedPriceTypes: allowed, role: 'customer' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '12h' }
        );

        res.status(200).json({ token, allowedPriceTypes: allowed });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Simple JWT verification middleware (for customer endpoints)
exports.verifyToken = (req, res, next) => {
    try {
        const auth = req.header('Authorization');
        if (!auth) return res.status(401).json({ message: 'No token provided' });

        const token = auth.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token không hợp lệ', error: error.message });
    }
};

// Admin: list customers
exports.listCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().select('_id name phone username allowedPriceTypes createdAt').lean();
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin: update customer (name, phone, allowedPriceTypes)
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, allowedPriceTypes } = req.body;

        const update = {};
        if (name) update.name = name;
        if (phone) {
            update.phone = phone;
            update.username = String(phone).trim();
        }
        if (allowedPriceTypes) update.allowedPriceTypes = Array.isArray(allowedPriceTypes) ? allowedPriceTypes : [allowedPriceTypes];

        const updated = await Customer.findByIdAndUpdate(id, update, { new: true }).select('_id name phone username allowedPriceTypes createdAt');
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin: delete customer
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Customer.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin: reset customer password (generate new temp password and return it)
exports.resetCustomerPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id);
        if (!customer) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });

        const username = String(customer.phone || customer.username || '').trim();
        const last3 = username.slice(-3) || '000';
        // password is name without diacritics + last3
        const rawName = String(customer.name || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '');
        const rawPassword = `${rawName}${last3}`;
        const passwordHash = await bcrypt.hash(rawPassword, 10);

        customer.passwordHash = passwordHash;
        await customer.save();

        res.status(200).json({ message: 'Đã reset mật khẩu', password: rawPassword });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};