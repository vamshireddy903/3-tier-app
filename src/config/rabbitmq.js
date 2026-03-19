// ─────────────────────────────────────────────────────────────────────────────
// RabbitMQ  —  order event bus
// GCP Migration note:
//   Replace publishToQueue() with @google-cloud/pubsub publish()
//   Replace startOrderConsumer() with Cloud Run Pub/Sub push subscription
// ─────────────────────────────────────────────────────────────────────────────

const amqp = require('amqplib');

let connection = null;
let channel    = null;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel    = await connection.createChannel();

    // Durable queue survives broker restarts
    await channel.assertQueue(process.env.RABBITMQ_ORDER_QUEUE, { durable: true });

    console.log('✅  RabbitMQ connected');

    connection.on('error', (err) => {
      console.error('RabbitMQ error:', err.message);
      setTimeout(connectRabbitMQ, 5000);
    });
    connection.on('close', () => {
      console.warn('RabbitMQ closed — reconnecting...');
      setTimeout(connectRabbitMQ, 5000);
    });
  } catch (err) {
    console.error('❌  RabbitMQ failed:', err.message);
    console.log('⏳  Retrying RabbitMQ in 5 s...');
    setTimeout(connectRabbitMQ, 5000);
  }
};

const getChannel = () => channel;

/**
 * Publish an event message to a queue.
 * @param {string} queue   - queue name
 * @param {object} payload - event payload object
 */
const publishToQueue = async (queue, payload) => {
  try {
    if (!channel) throw new Error('RabbitMQ channel not ready');
    channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }   // message survives broker restart
    );
    console.log(`📤  Published [${payload.eventType}] to queue [${queue}]`);
  } catch (err) {
    console.error('Failed to publish event:', err.message);
    // Non-fatal — order is already saved in SQL; email can be retried
  }
};

module.exports = { connectRabbitMQ, getChannel, publishToQueue };
