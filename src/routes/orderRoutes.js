const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/auth');
const { placeOrder, getMyOrders, getOrderByNumber } = require('../controllers/orderController');

// POST /api/orders  (protected)
router.post('/', authMiddleware, placeOrder);

// GET /api/orders/my-orders  (protected)
router.get('/my-orders', authMiddleware, getMyOrders);

// GET /api/orders/:orderNumber  (protected)
router.get('/:orderNumber', authMiddleware, getOrderByNumber);

module.exports = router;
