const mongoose = require('mongoose');

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅  MongoDB connected');
    await seedProducts();
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    console.log('⏳  Retrying MongoDB in 5 s...');
    setTimeout(connectMongo, 5000);
  }
};

const seedProducts = async () => {
  const Product = require('../models/Product');
  const count = await Product.countDocuments();
  if (count > 0) return; // already seeded

  const products = [
    {
      name: 'Olympic Barbell 20kg', category: 'weights', emoji: '🏋️',
      price: 4999, oldPrice: 6999, badge: 'Best Seller',
      description: 'Forged from high-tensile steel. Olympic specs. Rotating sleeves for smooth lifts.',
      inStock: true, stockQty: 50,
      specs: { Weight: '20 kg', Length: '220 cm', 'Max Load': '320 kg', Material: 'Chrome Steel', Grip: 'Knurled' },
      tags: ['barbell', 'weightlifting', 'olympic'],
    },
    {
      name: 'Cast Iron Dumbbell Set', category: 'weights', emoji: '💪',
      price: 2499, oldPrice: 3200, badge: 'Hot Deal',
      description: '5 to 25 kg pairs. Rubber-coated ends. Anti-roll hexagonal design.',
      inStock: true, stockQty: 80,
      specs: { Range: '5–25 kg', Coating: 'Rubber', Design: 'Hex', Pairs: '5', Finish: 'Matte Black' },
      tags: ['dumbbells', 'weights', 'cast iron'],
    },
    {
      name: 'Adjustable Dumbbell 32kg', category: 'weights', emoji: '🔩',
      price: 8999, oldPrice: null, badge: null,
      description: 'Replaces 15 sets of dumbbells. Quick-select dial system. Space-efficient.',
      inStock: true, stockQty: 30,
      specs: { Range: '2–32 kg', Increments: '2 kg', Width: '38 cm', Mechanism: 'Dial Select', Warranty: '2 yr' },
      tags: ['adjustable', 'dumbbells'],
    },
    {
      name: 'Treadmill Pro X9', category: 'cardio', emoji: '🏃',
      price: 54999, oldPrice: 69999, badge: 'New',
      description: 'Motor: 3.5HP. Max speed 20 km/h. 15-level auto incline. Foldable frame.',
      inStock: true, stockQty: 15,
      specs: { Motor: '3.5 HP', Speed: '0–20 km/h', Incline: '0–15%', Belt: '140×50 cm', Display: '7" LCD' },
      tags: ['treadmill', 'cardio', 'running'],
    },
    {
      name: 'Rowing Machine Air', category: 'cardio', emoji: '🚣',
      price: 34999, oldPrice: 42000, badge: null,
      description: 'Air resistance rowing machine. Full-body workout. Foldable for storage.',
      inStock: true, stockQty: 20,
      specs: { Resistance: 'Air', Levels: '10', Monitor: 'LCD', 'Max User': '130 kg', Fold: 'Yes' },
      tags: ['rowing', 'cardio', 'full body'],
    },
    {
      name: 'Resistance Band Kit', category: 'accessories', emoji: '🔴',
      price: 899, oldPrice: 1299, badge: 'Value Pick',
      description: 'Set of 5 resistance bands (5–40 lbs). Loop + long band designs. TPE material.',
      inStock: true, stockQty: 200,
      specs: { Count: '5 bands', Range: '5–40 lbs', Material: 'TPE', Length: '120 cm', 'Anti-snap': 'Yes' },
      tags: ['bands', 'resistance', 'accessories'],
    },
    {
      name: 'Leather Lifting Belt', category: 'accessories', emoji: '🪙',
      price: 1499, oldPrice: 2000, badge: null,
      description: 'Genuine leather with double prong buckle. Lumbar support for heavy lifts.',
      inStock: true, stockQty: 100,
      specs: { Material: 'Full Grain Leather', Width: '10 cm', Buckle: 'Double Prong', Sizes: 'S/M/L/XL' },
      tags: ['belt', 'powerlifting', 'accessories'],
    },
    {
      name: 'Power Rack - Home Edition', category: 'machines', emoji: '🏗️',
      price: 24999, oldPrice: 32000, badge: 'Top Rated',
      description: 'Steel power rack with J-hooks, safety bars, pull-up bar. Fits 7ft barbells.',
      inStock: true, stockQty: 10,
      specs: { Capacity: '350 kg', Height: '215 cm', Steel: '50×50 mm', Width: '100 cm', Weight: '68 kg' },
      tags: ['rack', 'power rack', 'machines'],
    },
    {
      name: 'Kettlebell Set 8–32kg', category: 'weights', emoji: '⚫',
      price: 12999, oldPrice: 16000, badge: null,
      description: 'Powder-coated cast iron. Wide flat base. Great for swings, Turkish get-ups.',
      inStock: true, stockQty: 40,
      specs: { Range: '8–32 kg', Count: '5 pieces', Coating: 'Powder', Handle: 'Smooth', Base: 'Flat' },
      tags: ['kettlebell', 'weights'],
    },
    {
      name: 'Spin Bike Elite', category: 'cardio', emoji: '🚴',
      price: 22999, oldPrice: 28999, badge: 'New',
      description: '40 kg flywheel. Magnetic resistance. Adjustable seat and handlebars.',
      inStock: true, stockQty: 25,
      specs: { Flywheel: '40 kg', Resistance: 'Magnetic', Levels: '32', Display: 'LCD', 'Max User': '150 kg' },
      tags: ['spin bike', 'cycling', 'cardio'],
    },
    {
      name: 'Pull-up & Dip Station', category: 'machines', emoji: '🔝',
      price: 8499, oldPrice: 10999, badge: null,
      description: 'Multi-grip pull-up bar with dip handles. No-bolt floor anchor system.',
      inStock: true, stockQty: 35,
      specs: { 'Max Load': '200 kg', Grips: 'Multi', Width: '70 cm', Height: '230 cm', Material: 'Steel' },
      tags: ['pull-up', 'dip', 'bodyweight'],
    },
    {
      name: 'Gym Gloves Pro', category: 'accessories', emoji: '🧤',
      price: 499, oldPrice: 799, badge: 'Best Value',
      description: 'Micro-fiber palm. Wrist wrap support. Anti-slip grip for bars and dumbbells.',
      inStock: true, stockQty: 300,
      specs: { Material: 'Microfiber', Wrist: 'Wrap included', Sizes: 'S/M/L/XL', Grip: 'Anti-slip' },
      tags: ['gloves', 'accessories', 'grip'],
    },
  ];

  await Product.insertMany(products);
  console.log(`✅  MongoDB: ${products.length} products seeded`);
};

module.exports = { connectMongo };
