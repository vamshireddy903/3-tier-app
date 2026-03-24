// ─────────────────────────────────────────────────────────────────────────────
// Google Cloud Pub/Sub — order event bus
// Replaces RabbitMQ completely
// ─────────────────────────────────────────────────────────────────────────────

const { PubSub } = require('@google-cloud/pubsub');

// Pub/Sub client (uses VM Service Account automatically)
const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
});

const topicName = process.env.PUBSUB_TOPIC;

/**
 * Publish an event message to Pub/Sub topic
 * @param {object} payload - event payload object
 */
const publishToTopic = async (payload) => {
  try {
    const messageBuffer = Buffer.from(JSON.stringify(payload));

    await pubsub.topic(topicName).publishMessage({
      data: messageBuffer,
    });

    console.log(`📤 Published [${payload.eventType}] to topic [${topicName}]`);
  } catch (err) {
    console.error('❌ Failed to publish event:', err.message);
    // Non-fatal — order already saved in DB
  }
};

module.exports = { publishToTopic };
