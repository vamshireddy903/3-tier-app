const amqp = require('amqplib');

async function start() {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();

    await channel.assertQueue('order_queue');

    console.log('Waiting for messages...');

    channel.consume('order_queue', (msg) => {
        const order = JSON.parse(msg.content.toString());

        console.log("📧 Sending email for order:", order.id);

        // simulate email
        console.log(`Email sent to ${order.email} with order ID ${order.id}`);

        channel.ack(msg);
    });
}

start();
