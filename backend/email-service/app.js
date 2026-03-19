const amqp = require('amqplib');

let channel;

// 🔁 Retry connection function
async function connectQueue() {
    let retries = 5;

    while (retries) {
        try {
            const connection = await amqp.connect('amqp://rabbitmq');
            const ch = await connection.createChannel();

            await ch.assertQueue('order_queue');

            console.log("✅ Email Worker connected to RabbitMQ");
            return ch;
        } catch (err) {
            console.log("❌ RabbitMQ not ready, retrying...");
            retries--;
            await new Promise(res => setTimeout(res, 5000));
        }
    }

    throw new Error("❌ Failed to connect to RabbitMQ");
}

async function startWorker() {
    channel = await connectQueue();

    console.log("📩 Waiting for orders...");

    channel.consume('order_queue', (msg) => {
        if (msg !== null) {
            const order = JSON.parse(msg.content.toString());

            console.log("📧 Sending email...");
            console.log(`✅ Email sent to ${order.email} for Order ID: ${order.id}`);

            channel.ack(msg);
        }
    });
}

startWorker();
