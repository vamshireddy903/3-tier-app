// ─────────────────────────────────────────────────────────────────────────────
// ORDER EVENT CONSUMER (Cloud Run - Pub/Sub PUSH)
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// ── SMTP Transporter ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ── Email HTML (same logic) ──────────────────────────────────
const buildEmailHTML = (evt) => {
  return `
    <h2>Order Confirmed 💪</h2>
    <p>Order #${evt.orderNumber}</p>
    <p>Total: ₹${evt.totalAmount}</p>
    <p>Thanks ${evt.userName}</p>
  `;
};

// ── Pub/Sub PUSH endpoint ────────────────────────────────────
app.post('/', async (req, res) => {
  try {
    const pubsubMessage = req.body.message;

    if (!pubsubMessage) {
      return res.status(400).send('No message');
    }

    // Decode base64 message
    const evt = JSON.parse(
      Buffer.from(pubsubMessage.data, 'base64').toString()
    );

    console.log(`📨 Event received: [${evt.eventType}] Order #${evt.orderNumber}`);

    if (evt.eventType === 'ORDER_PLACED') {
      await transporter.sendMail({
        from:    process.env.EMAIL_FROM,
        to:      evt.userEmail,
        subject: `✅ Order Confirmed — #${evt.orderNumber}`,
        html:    buildEmailHTML(evt),
      });

      console.log(`📧 Email sent → ${evt.userEmail}`);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).send('Error');
  }
});

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Cloud Run consumer running on port ${PORT}`);
});
