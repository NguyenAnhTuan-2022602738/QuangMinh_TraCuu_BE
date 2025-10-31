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

// Fetch all products with pagination
const getAllProducts = async (req, res) => {
    try {
        const pageParam = parseInt(req.query.page) || 1;
        const limitParam = req.query.limit;
        const isAllRequested = String(limitParam).toLowerCase() === 'all';

        let limit;
        if (isAllRequested) {
            limit = null;
        } else {
            const parsedLimit = parseInt(limitParam, 10);
            limit = Number.isNaN(parsedLimit) ? 50 : Math.max(parsedLimit, 1);
        }

        const totalProducts = await Product.countDocuments();
        const skip = limit ? (pageParam - 1) * limit : 0;

        let query = Product.find();
        if (limit) {
            query = query.skip(skip).limit(limit);
        }

        const products = await query;
        const totalPages = limit ? Math.max(Math.ceil(totalProducts / limit), 1) : 1;
        const currentPage = limit ? Math.min(pageParam, totalPages) : 1;
        const pageSize = limit || totalProducts;

        res.status(200).json({
            products,
            pagination: {
                currentPage,
                totalPages,
                totalProducts,
                productsPerPage: pageSize,
                hasNextPage: limit ? currentPage < totalPages : false,
                hasPrevPage: limit ? currentPage > 1 : false
            }
        });
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
            parentCategory: req.body.parentCategory || req.body.category, // Support both new and old field
            subcategory: req.body.subcategory || req.body.category || 'Chưa phân loại',
            category: req.body.category, // Keep for backward compatibility
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
        if (req.body.parentCategory) updateData.parentCategory = req.body.parentCategory;
        if (req.body.subcategory) updateData.subcategory = req.body.subcategory;
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
        const formattedProducts = products.map(p => {
            const parentCat = p.parentCategory || p.category || 'Chưa phân loại';
            const subCat = p.subcategory || p.category || 'Chưa phân loại';
            
            return {
                code: p.code,
                name: p.name,
                parentCategory: parentCat,
                subcategory: subCat,
                category: p.category || parentCat,  // For backward compatibility
                unit: p.unit,
                prices: {
                    BBCL: p.BBCL || 0,
                    BBPT: p.BBPT || 0,
                    BL: p.BL || 0, 
                    BLVIP: p.BLVIP || 0,
                    honda247: p.HONDA247 || 0
                }
            };
        });

        console.log('Importing products:', JSON.stringify(formattedProducts.slice(0, 2), null, 2));

        // Use insertMany with ordered: false to continue on duplicate key errors
        const result = await Product.insertMany(formattedProducts, { ordered: false })
            .catch(err => {
                // Handle duplicate key errors
                console.error('Import error details:', {
                    message: err.message,
                    code: err.code,
                    writeErrors: err.writeErrors?.length,
                    insertedDocs: err.insertedDocs?.length,
                    errors: err.errors
                });
                
                if (err.writeErrors && err.insertedDocs) {
                    console.log(`Inserted ${err.insertedDocs.length} products despite errors`);
                    return { insertedCount: err.insertedDocs.length };
                } else if (err.code === 11000) {
                    console.log('Duplicate key error');
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

// Return products with price according to priceType with pagination
async function getProductsByPriceType(req, res) {
    try {
        const { priceType } = req.params;
        const pageParam = parseInt(req.query.page, 10) || 1;
        const limitParamRaw = req.query.limit;
        const isAllRequested = typeof limitParamRaw === 'string' && limitParamRaw.toLowerCase() === 'all';

        let limit;
        if (isAllRequested) {
            limit = null;
        } else if (limitParamRaw === undefined) {
            limit = 50;
        } else {
            const parsedLimit = parseInt(limitParamRaw, 10);
            limit = Number.isNaN(parsedLimit) ? 50 : Math.max(parsedLimit, 1);
        }

        const skip = limit ? (pageParam - 1) * limit : 0;

        const normalized = String(priceType).toUpperCase();
        const allowed = ['BBCL', 'BBPT', 'BL', 'BLVIP', 'HONDA247'];
        if (!allowed.includes(normalized)) {
            return res.status(400).json({ message: 'Invalid price type', allowed });
        }

        // Access control: if request has a JWT, check allowedPriceTypes for customer tokens
        const authHeader = req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                // If token is admin, allow
                if (decoded.role === 'admin') {
                    // proceed
                } else if (decoded.role === 'customer') {
                    const allowedTypes = (decoded.allowedPriceTypes || []).map(s => String(s).toUpperCase());
                    if (!allowedTypes.includes(normalized)) {
                        return res.status(403).json({ message: 'Tài khoản không có quyền xem bảng giá này' });
                    }
                }
            } catch (err) {
                // Ignore token errors here; we'll still allow unauthenticated public access if desired
                console.warn('Token verify error in priceType route:', err.message);
            }
        }

        // Get total count for pagination
        const totalProducts = await Product.countDocuments();

        // Select both nested prices and possible top-level price fields with pagination
        let productsQuery = Product.find({}, {
            code: 1,
            name: 1,
            category: 1,
            parentCategory: 1,
            subcategory: 1,
            unit: 1,
            image: 1,
            prices: 1,
            BBCL: 1,
            BBPT: 1,
            BL: 1,
            BLVIP: 1,
            HONDA247: 1,
            honda247: 1,
        });

        if (limit) {
            productsQuery = productsQuery.skip(skip).limit(limit);
        }

        const products = await productsQuery.lean();

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
                parentCategory: p.parentCategory,
                subcategory: p.subcategory,
                category: p.category,
                unit: p.unit,
                price,
                image: p.image,
            };
        });

        const totalPages = limit ? Math.max(Math.ceil(totalProducts / limit), 1) : 1;
        const currentPage = limit ? Math.min(pageParam, totalPages) : 1;
        const pageSize = limit || totalProducts;

        res.status(200).json({
            products: mapped,
            pagination: {
                currentPage,
                totalPages,
                totalProducts,
                productsPerPage: pageSize,
                hasNextPage: limit ? currentPage < totalPages : false,
                hasPrevPage: limit ? currentPage > 1 : false
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}

// Get all parent categories
const getParentCategories = async (req, res) => {
    try {
        // Return simple array of category names
        const categories = await Product.distinct('parentCategory');
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get products by parent category with optional subcategory filter and pagination
const getProductsByParentCategory = async (req, res) => {
    try {
        const { parentCategory } = req.params;
        const { subcategory, priceType } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const filter = { parentCategory };
        if (subcategory) {
            filter.subcategory = subcategory;
        }

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);

        const products = await Product.find(filter).skip(skip).limit(limit).lean();

        // If priceType is specified, format response like getProductsByPriceType
        if (priceType) {
            const normalized = String(priceType).toUpperCase();
            const mapped = products.map(p => {
                let price = null;
                if (p.prices && p.prices[normalized] != null) {
                    price = p.prices[normalized];
                } else if (p.prices && normalized === 'HONDA247' && p.prices.honda247 != null) {
                    price = p.prices.honda247;
                } else if (p[normalized] != null) {
                    price = p[normalized];
                } else if (normalized === 'HONDA247' && p.honda247 != null) {
                    price = p.honda247;
                }

                return {
                    code: p.code,
                    name: p.name,
                    parentCategory: p.parentCategory,
                    subcategory: p.subcategory,
                    category: p.category,
                    unit: p.unit,
                    price,
                };
            });

            const totalPages = Math.ceil(totalProducts / limit);

            return res.status(200).json({
                products: mapped,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalProducts,
                    productsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });
        }

        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            products,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                productsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get subcategories for a parent category
const getSubcategories = async (req, res) => {
    try {
        const { parentCategory } = req.params;
        const subcategories = await Product.distinct('subcategory', { parentCategory });
        res.status(200).json(subcategories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Export all controller functions
module.exports = {
    getProductByCode,
    getAllProducts,
    getProductsByPriceType,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkCreateProducts,
    getParentCategories,
    getProductsByParentCategory,
    getSubcategories,
};