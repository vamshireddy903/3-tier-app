// src/index.js
require('dotenv').config();
const express = require('express');

const { connectSQL } = require('./config/sqlDb');
const { connectMongo } = require('./config/mongoDb');

const authRoutes    = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes   = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authRoutes);
app.use(productRoutes);
app.use(orderRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const start = async () => {
  await connectSQL();
  await connectMongo();
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
};

start();
