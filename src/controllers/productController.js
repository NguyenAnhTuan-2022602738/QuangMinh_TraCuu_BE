// product-lookup-system/server/src/controllers/productController.js

const Product = require('../models/Product');
const PriceMatrix = require('../models/PriceMatrix');

// Fetch product details by product code
const getProductByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const product = await Product.findOne({ code });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const prices = await PriceMatrix.find({ productId: product._id });
        res.status(200).json({ product, prices });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Fetch all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Create new product
const createProduct = async (req, res) => {
    try {
        // Định dạng lại dữ liệu đầu vào để phù hợp với schema
        const productData = {
            code: req.body.code,
            name: req.body.name,
            category: req.body.category,
            unit: req.body.unit,
            prices: {
                BBCL: req.body.BBCL || 0,
                BBPT: req.body.BBPT || 0,
                BL: req.body.BL || 0,
                BLVIP: req.body.BLVIP || 0,
                honda247: req.body.HONDA247 || 0
            }
        };
        
        const product = new Product(productData);
        await product.save();
        res.status(201).json({ message: 'Thêm sản phẩm thành công', product });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Mã sản phẩm đã tồn tại' });
        }
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Định dạng lại dữ liệu đầu vào để phù hợp với schema
        const updateData = {};
        
        // Xử lý các trường cơ bản
        if (req.body.code) updateData.code = req.body.code;
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.category) updateData.category = req.body.category;
        if (req.body.unit) updateData.unit = req.body.unit;
        
        // Xử lý trường prices
        if (req.body.BBCL !== undefined || req.body.BBPT !== undefined || 
            req.body.BL !== undefined || req.body.BLVIP !== undefined || req.body.HONDA247 !== undefined) {
            
            // Lấy dữ liệu sản phẩm hiện tại để không ghi đè các giá trị không được cập nhật
            const currentProduct = await Product.findById(id);
            if (!currentProduct) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }
            
            updateData.prices = {
                BBCL: req.body.BBCL !== undefined ? req.body.BBCL : currentProduct.prices.BBCL,
                BBPT: req.body.BBPT !== undefined ? req.body.BBPT : currentProduct.prices.BBPT,
                BL: req.body.BL !== undefined ? req.body.BL : currentProduct.prices.BL,
                BLVIP: req.body.BLVIP !== undefined ? req.body.BLVIP : currentProduct.prices.BLVIP,
                honda247: req.body.HONDA247 !== undefined ? req.body.HONDA247 : currentProduct.prices.honda247
            };
        }
        
        const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        
        res.status(200).json({ message: 'Cập nhật thành công', product });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Delete product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Bulk create products (for Excel import)
const bulkCreateProducts = async (req, res) => {
    try {
        const { products } = req.body;
        
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
        }

        // Chuyển đổi dữ liệu để khớp với schema
        const formattedProducts = products.map(p => ({
            code: p.code,
            name: p.name,
            category: p.category,
            unit: p.unit,
            prices: {
                BBCL: p.BBCL || 0,
                BBPT: p.BBPT || 0,
                BL: p.BL || 0, 
                BLVIP: p.BLVIP || 0,
                honda247: p.HONDA247 || 0
            }
        }));

        console.log('Importing products:', JSON.stringify(formattedProducts.slice(0, 2), null, 2));

        // Use insertMany with ordered: false to continue on duplicate key errors
        const result = await Product.insertMany(formattedProducts, { ordered: false })
            .catch(err => {
                // Handle duplicate key errors
                console.error('Import error:', err.message);
                if (err.writeErrors && err.insertedDocs) {
                    return { insertedCount: err.insertedDocs.length };
                } else if (err.code === 11000) {
                    return { insertedCount: err.result?.nInserted || 0 };
                }
                throw err;
            });
        
        const count = result.length || result.insertedCount || 0;
        res.status(201).json({ 
            message: `Import thành công ${count} sản phẩm`,
            count 
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Export the controller functions
module.exports = {
    getProductByCode,
    getAllProducts,
    getProductsByPriceType,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkCreateProducts,
};

// Return products with price according to priceType
async function getProductsByPriceType(req, res) {
    try {
        const { priceType } = req.params;
        const normalized = String(priceType).toUpperCase();
        const allowed = ['BBCL', 'BBPT', 'BL', 'BLVIP', 'HONDA247'];
        if (!allowed.includes(normalized)) {
            return res.status(400).json({ message: 'Invalid price type', allowed });
        }

        // Select both nested prices and possible top-level price fields
        const products = await Product.find({}, {
            code: 1,
            name: 1,
            category: 1,
            unit: 1,
            prices: 1,
            BBCL: 1,
            BBPT: 1,
            BL: 1,
            BLVIP: 1,
            HONDA247: 1,
            honda247: 1,
        }).lean();

        const mapped = products.map(p => {
            let price = null;
            // 1) Nested prices object, case-sensitive keys
            if (p.prices && p.prices[normalized] != null) {
                price = p.prices[normalized];
            }
            // 2) Nested prices with lowercase 'honda247'
            else if (p.prices && normalized === 'HONDA247' && p.prices.honda247 != null) {
                price = p.prices.honda247;
            }
            // 3) Top-level field with normalized key
            else if (p[normalized] != null) {
                price = p[normalized];
            }
            // 4) Top-level lowercase 'honda247'
            else if (normalized === 'HONDA247' && p.honda247 != null) {
                price = p.honda247;
            }

            return {
                code: p.code,
                name: p.name,
                category: p.category,
                unit: p.unit,
                price,
            };
        });

        res.status(200).json(mapped);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}