const Product = require('../models/Product');

// ─── GET ALL PRODUCTS ─────────────────────────────────────────────────────────
// Supports: ?category=weights  ?search=barbell  ?page=1  ?limit=20
const getProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    return res.json({
      success: true,
      products,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('getProducts error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// ─── GET SINGLE PRODUCT ───────────────────────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

// ─── GET AVAILABLE CATEGORIES ─────────────────────────────────────────────────
const getCategories = async (_req, res) => {
  try {
    const categories = await Product.distinct('category');
    return res.json({ success: true, categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

module.exports = { getProducts, getProductById, getCategories };
