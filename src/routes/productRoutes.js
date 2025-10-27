const express = require('express');
const { 
    getProductByCode, 
    getAllProducts, 
    getProductsByPriceType,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkCreateProducts,
    getParentCategories,
    getProductsByParentCategory,
    getSubcategories
} = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Base in app.js is /api/products, so here use relative paths only

// Get all products
router.get('/', getAllProducts);

// Get all parent categories
router.get('/categories/parent', getParentCategories);

// Get subcategories for a parent category
router.get('/categories/:parentCategory/subcategories', getSubcategories);

// Get products by parent category (with optional subcategory query param)
router.get('/categories/:parentCategory/products', getProductsByParentCategory);

// Get product by code
router.get('/code/:code', getProductByCode);

// Create new product (admin only)
router.post('/', authMiddleware, createProduct);

// Bulk create products (admin only, for Excel import)
router.post('/bulk', authMiddleware, bulkCreateProducts);

// Update product (admin only)
router.put('/:id', authMiddleware, updateProduct);

// Delete product (admin only)
router.delete('/:id', authMiddleware, deleteProduct);

// Get products with a specific price type (BBCL, BBPT, BL, BLVIP, honda247)
// This must be last to avoid conflicts with other routes
router.get('/:priceType', getProductsByPriceType);

module.exports = router;