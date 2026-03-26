require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// ── Health Check ──────────────────────────────
app.get('/', (req, res) => {
  res.send('✅ Order Consumer is running');
});

// ── SMTP Transporter ──────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Build HTML Email ─────────────────────────
const buildEmailHTML = (evt) => `
  <h2>Order Confirmed 💪</h2>
  <p>Order #${evt.orderNumber}</p>
  <p>Total: ₹${evt.totalAmount}</p>
  <p>Thanks, ${evt.userName}!</p>
`;

// ── Pub/Sub PUSH Endpoint ────────────────────
app.post('/', async (req, res) => {
  try {
    console.log('📥 Raw Pub/Sub message:', JSON.stringify(req.body, null, 2));

    const pubsubMessage = req.body.message;
    if (!pubsubMessage || !pubsubMessage.data) {
      console.error('❌ No message data');
      return res.status(400).send('No message data');
    }

    // Decode Base64 data
    const evt = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());

    console.log(`📨 Event received: [${evt.eventType}] Order #${evt.orderNumber}`);

    // Validate email
    if (!evt.userEmail) {
      console.error('❌ No userEmail in event, skipping email');
      return res.status(400).send('No userEmail in message');
    }

    if (evt.eventType === 'ORDER_PLACED') {
      try {
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: evt.userEmail,
          subject: `✅ Order Confirmed — #${evt.orderNumber}`,
          html: buildEmailHTML(evt),
        });
        console.log(`📧 Email sent → ${evt.userEmail}: ${info.response}`);
      } catch (mailErr) {
        console.error('❌ Failed to send email:', mailErr.message);
      }
    }

    // Respond 200 to Pub/Sub
    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Error processing Pub/Sub message:', err.message);
    res.status(500).send('Server error');
  }
});

// ── Start Server ─────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Order Consumer running on port ${PORT}`);
});
