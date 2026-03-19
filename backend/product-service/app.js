const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://mongo:27017/products');

const Product = mongoose.model('Product', {
    name: String,
    price: Number,
    description: String,
    category: String
});

// Add product
app.post('/products', async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
});

// Get all products
app.get('/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

app.listen(5002, () => console.log('Product Service running on 5002'));
