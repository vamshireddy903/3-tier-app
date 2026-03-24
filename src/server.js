require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const { connectSQL }   = require('./config/sqlDb');
const { connectMongo } = require('./config/mongoDb');
const { startOrderConsumer } = require('./consumers/orderConsumer');

const authRoutes    = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes   = require('./routes/orderRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin:      [process.env.FRONTEND_URL, 'http://localhost', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'vamshi-fitness-backend', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (_req, res) => {
  res.json({ message: '💪 Vamshi Fitness API is running' });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Boot ─────────────────────────────────────────────────
const start = async () => {
  await connectSQL();
  await connectMongo();

  // Start Pub/Sub consumer
  setTimeout(startOrderConsumer, 3000);

  app.listen(PORT, () => {
    console.log(`💪 Backend running on port ${PORT}`);
  });
};

start();
