const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getPool } = require('../config/sqlDb');

// ─── REGISTER ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const pool = getPool();
    if (!pool) return res.status(503).json({ success: false, message: 'Database not ready, try again shortly' });

    // Check duplicate email
    const existing = await pool.request()
      .input('email', email.toLowerCase())
      .query('SELECT id FROM Users WHERE email = @email');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ success: false, message: 'This email is already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert into SQL Server
    const result = await pool.request()
      .input('name',          name)
      .input('email',         email.toLowerCase())
      .input('phone',         phone || null)
      .input('password_hash', passwordHash)
      .query(`
        INSERT INTO Users (name, email, phone, password_hash)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.created_at
        VALUES (@name, @email, @phone, @password_hash)
      `);

    const user  = result.recordset[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log(`👤  New user registered: ${user.email}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Vamshi Fitness.',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const pool = getPool();
    if (!pool) return res.status(503).json({ success: false, message: 'Database not ready, try again shortly' });

    const result = await pool.request()
      .input('email', email.toLowerCase())
      .query('SELECT * FROM Users WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user    = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log(`🔑  User logged in: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
};

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', req.user.id)
      .query('SELECT id, name, email, phone, created_at FROM Users WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user: result.recordset[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

module.exports = { register, login, getProfile };
