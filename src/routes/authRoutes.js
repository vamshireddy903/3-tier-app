const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/auth');
const { register, login, getProfile } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile  (protected)
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
