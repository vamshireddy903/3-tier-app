// ─────────────────────────────────────────────────────────────────────────────
// VAMSHI FITNESS — Backend API Server
//
// Architecture:
//   Express API  ──▶  SQL Server  (users, orders)
//   Express API  ──▶  MongoDB     (product catalog)
//   Express API  ──▶  RabbitMQ    (order event publish)
//   Consumer     ──▶  RabbitMQ    (order event consume)
//   Consumer     ──▶  Nodemailer  (confirmation email)
//
// GCP later:
//   SQL Server  → Cloud SQL (SQL Server edition)
//   MongoDB     → Atlas or self-managed on GCE VM
//   RabbitMQ    → Google Cloud Pub/Sub
//   Consumer    → Cloud Run (Pub/Sub push subscription)
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const { connectSQL }       = require('./config/sqlDb');
const { connectMongo }     = require('./config/mongoDb');
const { connectRabbitMQ }  = require('./config/rabbitmq');
const { startOrderConsumer } = require('./consumers/orderConsumer');

const authRoutes    = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes   = require('./routes/orderRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      [process.env.FRONTEND_URL, 'http://localhost', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (lightweight — use morgan/winston in production)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);

// Health check — used by Docker / load balancer
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'vamshi-fitness-backend', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (_req, res) => {
  res.json({ message: '💪 Vamshi Fitness API is running' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Boot sequence ─────────────────────────────────────────────────────────────
const start = async () => {
  // Connect to all services (each retries independently on failure)
  await connectSQL();
  await connectMongo();
  await connectRabbitMQ();

  // Start the RabbitMQ consumer (waits for channel to be ready internally)
  setTimeout(startOrderConsumer, 3000);

  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   💪  VAMSHI FITNESS API — STARTED       ║');
    console.log(`║   Port  : ${PORT}                           ║`);
    console.log(`║   Env   : ${process.env.NODE_ENV}                   ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log('  POST  /api/auth/register');
    console.log('  POST  /api/auth/login');
    console.log('  GET   /api/auth/profile        [protected]');
    console.log('  GET   /api/products');
    console.log('  GET   /api/products/:id');
    console.log('  GET   /api/products/categories');
    console.log('  POST  /api/orders              [protected]');
    console.log('  GET   /api/orders/my-orders    [protected]');
    console.log('  GET   /api/orders/:orderNumber [protected]');
    console.log('  GET   /health');
    console.log('');
  });
};

start();
