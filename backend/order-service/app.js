const express = require('express');
const amqp = require('amqplib');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let channel;

async function connectQueue() {
    const connection = await amqp.connect('amqp://rabbitmq');
    channel = await connection.createChannel();
    await channel.assertQueue('order_queue');
}

connectQueue();

// place order
app.post('/order', async (req, res) => {
    const order = {
        id: Date.now(),
        ...req.body
    };

    // send to RabbitMQ
    channel.sendToQueue('order_queue', Buffer.from(JSON.stringify(order)));

    res.json({ message: 'Order placed', order });
});

app.listen(5003, () => console.log('Order Service running on 5003'));
