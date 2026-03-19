const express = require('express');
const amqp = require('amqplib');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let channel;

// 🔁 Retry connection function
async function connectQueue() {
    let retries = 5;

    while (retries) {
        try {
            const connection = await amqp.connect('amqp://rabbitmq');
            const ch = await connection.createChannel();

            await ch.assertQueue('order_queue');

            console.log("✅ Connected to RabbitMQ");
            return ch;
        } catch (err) {
            console.log("❌ RabbitMQ not ready, retrying...");
            retries--;
            await new Promise(res => setTimeout(res, 5000));
        }
    }

    throw new Error("❌ Failed to connect to RabbitMQ");
}

// Initialize queue connection
(async () => {
    channel = await connectQueue();
})();

// 📦 Place Order API
app.post('/order', async (req, res) => {
    const order = {
        id: Date.now(),
        ...req.body
    };

    if (!channel) {
        return res.status(500).json({ message: "Queue not ready" });
    }

    channel.sendToQueue('order_queue', Buffer.from(JSON.stringify(order)));

    console.log("📤 Order sent to queue:", order.id);

    res.json({
        message: 'Order placed successfully',
        order
    });
});

app.listen(5003, () => console.log('🚀 Order Service running on 5003'));
