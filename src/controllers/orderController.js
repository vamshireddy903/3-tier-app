const { getPool }        = require('../config/sqlDb');
const { publishToQueue } = require('../config/rabbitmq');

// Generate a readable order number like VF20241203001
const generateOrderNumber = () => {
  const ts   = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `VF${ts}${rand}`;
};

// ─── PLACE ORDER ─────────────────────────────────────────────────────────────
const placeOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;
    const { id: userId, email: userEmail, name: userName } = req.user;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }
    if (!deliveryAddress || !deliveryAddress.address || !deliveryAddress.city) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    // Calculate totals
    const subtotal    = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryFee = subtotal >= 5000 ? 0 : 99;   // Free delivery above ₹5000
    const totalAmount = subtotal + deliveryFee;

    const orderNumber = generateOrderNumber();

    const pool = getPool();
    if (!pool) return res.status(503).json({ success: false, message: 'Database not ready' });

    // ── Save order to SQL Server ──────────────────────────────────────────────
    const result = await pool.request()
      .input('order_number',     orderNumber)
      .input('user_id',          userId)
      .input('user_email',       userEmail)
      .input('user_name',        userName)
      .input('items',            JSON.stringify(items))
      .input('subtotal',         subtotal)
      .input('delivery_fee',     deliveryFee)
      .input('total_amount',     totalAmount)
      .input('payment_method',   paymentMethod || 'upi')
      .input('delivery_address', JSON.stringify(deliveryAddress))
      .query(`
        INSERT INTO Orders
          (order_number, user_id, user_email, user_name, items,
           subtotal, delivery_fee, total_amount, payment_method, delivery_address)
        OUTPUT
          INSERTED.id, INSERTED.order_number, INSERTED.order_status,
          INSERTED.total_amount, INSERTED.created_at
        VALUES
          (@order_number, @user_id, @user_email, @user_name, @items,
           @subtotal, @delivery_fee, @total_amount, @payment_method, @delivery_address)
      `);

    const savedOrder = result.recordset[0];
    console.log(`🛒  Order saved: #${orderNumber} — ₹${totalAmount} — ${userEmail}`);

    // ── Publish ORDER_PLACED event to RabbitMQ ────────────────────────────────
    // Consumer will pick this up and send the confirmation email
    await publishToQueue(process.env.RABBITMQ_ORDER_QUEUE, {
      eventType:       'ORDER_PLACED',
      orderId:         savedOrder.id,
      orderNumber,
      userId,
      userEmail,
      userName,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod:   paymentMethod || 'upi',
      deliveryAddress,
      timestamp:       new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! Confirmation email is on its way.',
      order: {
        id:                savedOrder.id,
        orderNumber:       savedOrder.order_number,
        status:            savedOrder.order_status,
        subtotal,
        deliveryFee,
        totalAmount,
        estimatedDelivery: '2–4 business days',
      },
    });
  } catch (err) {
    console.error('placeOrder error:', err);
    return res.status(500).json({ success: false, message: 'Failed to place order', error: err.message });
  }
};

// ─── MY ORDERS ────────────────────────────────────────────────────────────────
const getMyOrders = async (req, res) => {
  try {
    const pool   = getPool();
    const result = await pool.request()
      .input('user_id', req.user.id)
      .query('SELECT * FROM Orders WHERE user_id = @user_id ORDER BY created_at DESC');

    const orders = result.recordset.map(o => ({
      ...o,
      items:            JSON.parse(o.items),
      delivery_address: JSON.parse(o.delivery_address),
    }));

    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// ─── SINGLE ORDER BY ORDER NUMBER ────────────────────────────────────────────
const getOrderByNumber = async (req, res) => {
  try {
    const pool   = getPool();
    const result = await pool.request()
      .input('order_number', req.params.orderNumber)
      .input('user_id',      req.user.id)
      .query('SELECT * FROM Orders WHERE order_number = @order_number AND user_id = @user_id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const o = result.recordset[0];
    return res.json({
      success: true,
      order: {
        ...o,
        items:            JSON.parse(o.items),
        delivery_address: JSON.parse(o.delivery_address),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

module.exports = { placeOrder, getMyOrders, getOrderByNumber };
