const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        if (!req.header('Authorization')) {
            throw new Error('Không có token xác thực');
        }
        
        const token = req.header('Authorization').replace('Bearer ', '');
        // Chỉ kiểm tra tính hợp lệ của token, không kiểm tra role
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        if (!decoded || !decoded.isAuthenticated) {
            throw new Error('Token không hợp lệ');
        }

        // Không cần lưu ID vì không có người dùng cụ thể
        next();
    } catch (error) {
        console.error('Auth Error:', error.message);
        res.status(401).json({ message: 'Vui lòng đăng nhập với quyền Admin', error: error.message });
    }
};

module.exports = authMiddleware;