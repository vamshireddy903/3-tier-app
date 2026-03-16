import random
import requests

def generate_otp():
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_email_pubsub(to_email, subject, body):
    """
    Simulate sending an email via Pub/Sub.
    Replace with real GCP Pub/Sub or Cloud Function integration later.
    """
    payload = {
        "to": to_email,
        "subject": subject,
        "body": body
    }
    print(f"[Pub/Sub] Sending message: {payload}")
    # Uncomment below for real Pub/Sub HTTP push
    # requests.post("PUBSUB_ENDPOINT", json=payload)
