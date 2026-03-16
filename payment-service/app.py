from flask import Flask, request, jsonify
from common.utils import send_email_pubsub
import mysql.connector
import os

app = Flask(__name__)

def get_db():
    return mysql.connector.connect(
        host=os.environ['DB_HOST'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        database=os.environ['DB_NAME']
    )

# Make a payment
@app.route("/payment", methods=["POST"])
def make_payment():
    data = request.json
    username = data.get("username")
    amount = data.get("amount")

    if not username or not amount:
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO orders (username, total_amount) VALUES (%s, %s)",
            (username, amount)
        )
        conn.commit()
        cursor.close()
        conn.close()

        # Send payment confirmation email via Pub/Sub
        send_email_pubsub(
            to_email=f"{username}@example.com",
            subject="Payment Successful",
            body=f"Hello {username}, your payment of ${amount} has been processed successfully!"
        )

        return jsonify({"message": "Payment processed successfully"}), 200
    except mysql.connector.Error as e:
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5004)
