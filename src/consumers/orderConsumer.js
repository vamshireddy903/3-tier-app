// ─────────────────────────────────────────────────────────────────────────────
// ORDER EVENT CONSUMER
//
// Listens on the RabbitMQ `order_events` queue.
// When an ORDER_PLACED event arrives it sends a branded HTML confirmation
// email to the customer using Nodemailer.
//
// GCP Migration:
//   • Replace this consumer with a Cloud Run service
//   • Subscribe it to a Pub/Sub topic via push subscription
// ─────────────────────────────────────────────────────────────────────────────

const nodemailer = require('nodemailer');
const { getChannel } = require('../config/rabbitmq');

// ── Create reusable SMTP transporter ─────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

// ── Build branded HTML email ──────────────────────────────────────────────────
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

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 0;background:#0a0a0a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <div style="max-width:620px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:10px;overflow:hidden;">

    <!-- ── HEADER ── -->
    <div style="background:#e8230a;padding:36px 40px;text-align:center;">
      <div style="font-size:32px;font-weight:900;letter-spacing:4px;color:#fff;text-transform:uppercase;">
        VAMSHI FITNESS
      </div>
      <div style="margin-top:8px;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.75);">
        Order Confirmation
      </div>
    </div>

    <!-- ── GREETING ── -->
    <div style="padding:36px 40px 0;">
      <h2 style="margin:0 0 10px;color:#f5f0eb;font-size:22px;">
        Your order is confirmed! 💪
      </h2>
      <p style="margin:0;color:#888;font-size:15px;line-height:1.7;">
        Hey <strong style="color:#f5f0eb;">${evt.userName}</strong> — we've got your order and it's being prepared. 
        Get ready to forge your strength!
      </p>
    </div>

    <!-- ── ORDER ID BOX ── -->
    <div style="margin:28px 40px 0;">
      <div style="background:#181818;border:1px solid #2a2a2a;border-left:4px solid #e8230a;border-radius:6px;padding:18px 22px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666;">Order ID</div>
        <div style="margin-top:6px;font-size:22px;font-weight:700;color:#e8230a;letter-spacing:1px;">
          #${evt.orderNumber}
        </div>
        <div style="margin-top:6px;font-size:12px;color:#555;">Placed on ${placedOn}</div>
      </div>
    </div>

    <!-- ── ITEMS TABLE ── -->
    <div style="margin:28px 40px 0;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#555;margin-bottom:12px;">
        Items Ordered
      </div>
      <table style="width:100%;border-collapse:collapse;background:#181818;border:1px solid #2a2a2a;border-radius:6px;overflow:hidden;">
        <thead>
          <tr style="background:#1e1e1e;">
            <th style="padding:10px 16px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#555;text-align:left;font-weight:600;">Product</th>
            <th style="padding:10px 16px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#555;text-align:center;font-weight:600;">Qty</th>
            <th style="padding:10px 16px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#555;text-align:right;font-weight:600;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- ── PRICE SUMMARY ── -->
    <div style="margin:20px 40px 0;">
      <div style="background:#181818;border:1px solid #2a2a2a;border-radius:6px;padding:18px 22px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:14px;color:#888;">Subtotal</span>
          <span style="font-size:14px;color:#aaa;">₹${evt.subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:14px;">
          <span style="font-size:14px;color:#888;">Delivery</span>
          <span style="font-size:14px;color:${evt.deliveryFee === 0 ? '#4caf50' : '#aaa'};">
            ${evt.deliveryFee === 0 ? 'FREE' : '₹' + evt.deliveryFee}
          </span>
        </div>
        <div style="border-top:1px solid #2a2a2a;padding-top:14px;display:flex;justify-content:space-between;">
          <span style="font-size:18px;font-weight:700;color:#f5f0eb;">Total Paid</span>
          <span style="font-size:18px;font-weight:700;color:#e8230a;">₹${evt.totalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div style="margin-top:10px;font-size:12px;color:#555;">
          Payment method: ${evt.paymentMethod.toUpperCase()}
        </div>
      </div>
    </div>

    <!-- ── DELIVERY ADDRESS ── -->
    <div style="margin:20px 40px 0;">
      <div style="background:#181818;border:1px solid #2a2a2a;border-radius:6px;padding:18px 22px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#555;margin-bottom:10px;">
          Delivering To
        </div>
        <div style="font-size:14px;color:#e0dbd4;line-height:1.7;">${addrStr}</div>
        ${addr.phone ? `<div style="margin-top:6px;font-size:13px;color:#666;">📞 ${addr.phone}</div>` : ''}
      </div>
    </div>

    <!-- ── ETA BANNER ── -->
    <div style="margin:20px 40px 0;">
      <div style="text-align:center;background:rgba(232,35,10,0.07);border:1px solid rgba(232,35,10,0.2);border-radius:6px;padding:18px;">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#888;margin-bottom:6px;">
          Estimated Delivery
        </div>
        <div style="font-size:17px;font-weight:600;color:#f5f0eb;">🚀 2–4 Business Days</div>
      </div>
    </div>

    <!-- ── CLOSING NOTE ── -->
    <div style="padding:28px 40px;">
      <p style="margin:0;font-size:14px;color:#666;line-height:1.8;">
        Have questions about your order? Just reply to this email.<br/>
        Keep grinding — the equipment is on its way! 💪<br/><br/>
        <strong style="color:#888;">— Team Vamshi Fitness</strong>
      </p>
    </div>

    <!-- ── FOOTER ── -->
    <div style="background:#0d0d0d;padding:20px 40px;text-align:center;border-top:1px solid #1e1e1e;">
      <div style="font-size:11px;color:#3a3a3a;letter-spacing:0.5px;">
        © 2024 Vamshi Fitness &nbsp;·&nbsp; Made with ❤️ in Hyderabad, India
      </div>
    </div>

  </div>
</body>
</html>`;
};

// ── Start consumer ────────────────────────────────────────────────────────────
const startOrderConsumer = async () => {
  const channel = getChannel();

  if (!channel) {
    console.warn('⏳  Order consumer: RabbitMQ not ready, retrying in 5 s...');
    setTimeout(startOrderConsumer, 5000);
    return;
  }

  const queue       = process.env.RABBITMQ_ORDER_QUEUE;
  const transporter = createTransporter();

  // Verify SMTP on startup
  try {
    await transporter.verify();
    console.log('✅  SMTP transporter ready');
  } catch (err) {
    console.warn('⚠️   SMTP verify failed (emails may not send):', err.message);
  }

  // Process one message at a time
  channel.prefetch(1);

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const evt = JSON.parse(msg.content.toString());
      console.log(`📨  Event received: [${evt.eventType}] Order #${evt.orderNumber} — ${evt.userEmail}`);

      if (evt.eventType === 'ORDER_PLACED') {
        await transporter.sendMail({
          from:    process.env.EMAIL_FROM,
          to:      evt.userEmail,
          subject: `✅ Order Confirmed — #${evt.orderNumber} | Vamshi Fitness`,
          html:    buildEmailHTML(evt),
        });

        console.log(`📧  Confirmation email sent → ${evt.userEmail}`);
      }

      channel.ack(msg);  // Acknowledge — remove from queue
    } catch (err) {
      console.error('❌  Consumer error:', err.message);
      channel.nack(msg, false, true);  // Requeue on failure
    }
  });

  console.log(`👂  Order consumer listening on [${queue}]`);
};

module.exports = { startOrderConsumer };
