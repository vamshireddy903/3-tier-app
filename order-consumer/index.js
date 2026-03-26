const functions = require('@google-cloud/functions-framework');
const nodemailer = require('nodemailer');

// SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Function entry point
functions.cloudEvent('sendEmail', async (cloudEvent) => {
  try {
    const message = cloudEvent.data.message;

    if (!message || !message.data) {
      console.error('❌ No message data');
      return;
    }

    const evt = JSON.parse(
      Buffer.from(message.data, 'base64').toString()
    );

    console.log(`📨 Event received: ${evt.eventType}`);

    if (!evt.userEmail) {
      console.error('❌ Missing email');
      return;
    }

    if (evt.eventType === 'ORDER_PLACED') {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: evt.userEmail,
        subject: `Order Confirmed #${evt.orderNumber}`,
        html: `
          <h2>Order Confirmed 💪</h2>
          <p>Order #${evt.orderNumber}</p>
          <p>Total: ₹${evt.totalAmount}</p>
          <p>Thanks ${evt.userName}</p>
        `,
      });

      console.log(`📧 Email sent to ${evt.userEmail}`);
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
});
