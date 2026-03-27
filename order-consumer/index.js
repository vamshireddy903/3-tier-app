import nodemailer from "nodemailer";

export const sendEmail = async (event) => {
  console.log("Full event:", JSON.stringify(event));

  if (!event?.data) {
    console.error("❌ No data in the event");
    return;
  }

  const messageJson = JSON.parse(Buffer.from(event.data, "base64").toString());
  console.log("Decoded message:", messageJson);

  const { orderNumber, userEmail, eventType } = messageJson;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: `Order Confirmation - ${orderNumber}`,
    text: `Hello! Your order ${orderNumber} has been received. Event type: ${eventType}`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("✅ Email sent:", info.messageId);
};
