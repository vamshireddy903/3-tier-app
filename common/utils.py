# common/utils.py
import random
import json
import os
from google.cloud import pubsub_v1

# Initialize Pub/Sub publisher
publisher = pubsub_v1.PublisherClient()
PUBSUB_TOPIC = os.environ.get("PUBSUB_TOPIC")  # Set in docker-compose/env

def generate_otp():
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_email_pubsub(to_email, subject, body):
    """Send message to Pub/Sub for real-time email notifications"""
    if not PUBSUB_TOPIC:
        raise Exception("PUBSUB_TOPIC environment variable not set")

    message = {"to": to_email, "subject": subject, "body": body}
    data = json.dumps(message).encode("utf-8")
    future = publisher.publish(PUBSUB_TOPIC, data)
    print(f"[Pub/Sub] Published message ID: {future.result()}")
