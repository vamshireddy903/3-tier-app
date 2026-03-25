require('dotenv').config();
const express = require('express');

const { connectSQL } = require('./config/sqlDb');
const { connectMongo } = require('./config/mongoDb');

const authRoutes    = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes   = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API Routes (IMPORTANT FIX)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// ✅ Health check (for Load Balancer)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
const start = async () => {
  try {
    await connectSQL();
    console.log('✅ SQL Server connected');

    await connectMongo();
    console.log('✅ MongoDB connected');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

start();
