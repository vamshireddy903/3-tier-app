const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    category:    {
      type: String, required: true,
      enum: ['weights', 'cardio', 'accessories', 'machines'],
    },
    emoji:       { type: String, default: '💪' },
    price:       { type: Number, required: true, min: 0 },
    oldPrice:    { type: Number, default: null },
    badge:       { type: String, default: null },
    description: { type: String, required: true },
    inStock:     { type: Boolean, default: true },
    stockQty:    { type: Number, default: 0 },
    specs:       { type: mongoose.Schema.Types.Mixed, default: {} },
    tags:        [{ type: String }],
    rating:      { type: Number, default: 4.5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for fast filtering and full-text search
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
