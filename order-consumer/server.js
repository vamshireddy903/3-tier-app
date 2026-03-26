require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
  res.send('✅ Order Consumer is running');
});

// SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email builder
const buildEmailHTML = (evt) => `
<h2>Order Confirmed 💪</h2>
<p>Order #${evt.orderNumber}</p>
<p>Total: ₹${evt.totalAmount}</p>
<p>Thanks, ${evt.userName}!</p>
`;

// Pub/Sub endpoint
app.post('/', async (req, res) => {
  try {
    const pubsubMessage = req.body.message;
    if (!pubsubMessage || !pubsubMessage.data) return res.status(400).send('No message data');

    const evt = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
    if (!evt.userEmail) return res.status(400).send('No userEmail');

    if (evt.eventType === 'ORDER_PLACED') {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: evt.userEmail,
        subject: `✅ Order Confirmed — #${evt.orderNumber}`,
        html: buildEmailHTML(evt),
      });
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).send('Server error');
  }
});

// 🚀 Start server on Cloud Run injected PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Order Consumer running on port ${PORT}`));
