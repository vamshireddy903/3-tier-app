const express    = require('express');
const router     = express.Router();
const { getProducts, getProductById, getCategories } = require('../controllers/productController');

// GET /api/products?category=weights&search=barbell&page=1&limit=20
router.get('/', getProducts);

// GET /api/products/categories
router.get('/categories', getCategories);

// GET /api/products/:id
router.get('/:id', getProductById);

module.exports = router;
