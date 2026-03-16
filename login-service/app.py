from flask import Flask, request, jsonify
from werkzeug.security import check_password_hash
from common.utils import generate_otp, send_email_pubsub
import mysql.connector
import os

app = Flask(__name__)
otp_store = {}  # In-memory OTP store (production → Redis)

def get_db():
    return mysql.connector.connect(
        host=os.environ['DB_HOST'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        database=os.environ['DB_NAME']
    )

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT password, email FROM users WHERE username=%s", (username,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if row and check_password_hash(row[0], password):
        otp = generate_otp()
        otp_store[username] = otp
        send_email_pubsub(row[1], "Your OTP", f"Your OTP is {otp}")
        return jsonify({"message": "OTP sent to email"}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    username = data.get("username")
    otp = data.get("otp")

    if otp_store.get(username) == otp:
        otp_store.pop(username)
        return jsonify({"message": "Login successful"}), 200
    return jsonify({"error": "Invalid OTP"}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)
