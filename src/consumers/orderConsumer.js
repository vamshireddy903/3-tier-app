// ─────────────────────────────────────────────────────────────────────────────
// ORDER EVENT CONSUMER (Pub/Sub version)
// ─────────────────────────────────────────────────────────────────────────────

const nodemailer = require('nodemailer');
const { PubSub } = require('@google-cloud/pubsub');

// Pub/Sub client
const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
});

const subscriptionName = process.env.PUBSUB_SUBSCRIPTION;

// ── Create reusable SMTP transporter ─────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

// ── Build branded HTML email (same as before) ────────────────────────────────
const buildEmailHTML = (evt) => {
  const addr      = evt.deliveryAddress;
  const addrStr   = [addr.address, addr.city, addr.state, addr.pinCode].filter(Boolean).join(', ');
  const placedOn  = new Date(evt.timestamp).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const itemRows = evt.items.map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #242424;font-size:14px;color:#e0dbd4;">
        ${item.emoji || '📦'}&nbsp;&nbsp;${item.name}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #242424;font-size:14px;color:#888;text-align:center;">
        × ${item.qty}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #242424;font-size:14px;color:#e8230a;font-weight:700;text-align:right;">
        ₹${(item.price * item.qty).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html><body>
    <h2>Order Confirmed 💪</h2>
    <p>Order #${evt.orderNumber}</p>
    <p>Total: ₹${evt.totalAmount}</p>
    <p>Thanks ${evt.userName}</p>
  </body></html>`;
};

// ── Start Pub/Sub Consumer ───────────────────────────────────────────────────
const startOrderConsumer = async () => {
  const subscription = pubsub.subscription(subscriptionName);
  const transporter  = createTransporter();

  try {
    await transporter.verify();
    console.log('✅ SMTP transporter ready');
  } catch (err) {
    console.warn('⚠️ SMTP verify failed:', err.message);
  }

  console.log(`👂 Listening to Pub/Sub subscription [${subscriptionName}]`);

  subscription.on('message', async (message) => {
    try {
      const evt = JSON.parse(message.data.toString());

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

      message.ack(); // ✅ acknowledge message
    } catch (err) {
      console.error('❌ Consumer error:', err.message);
      message.nack(); // retry
    }
  });
};

module.exports = { startOrderConsumer };
