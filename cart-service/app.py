from flask import Flask, request, jsonify
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

# Fetch all products
@app.route("/products", methods=["GET"])
def get_products():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(products)

# Add item to cart
@app.route("/cart/add", methods=["POST"])
def add_to_cart():
    data = request.json
    username = data.get("username")
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO cart (username, product_id, quantity) VALUES (%s, %s, %s)",
        (username, product_id, quantity)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Added to cart"}), 200

# View cart for a user
@app.route("/cart/view/<username>", methods=["GET"])
def view_cart(username):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.id, c.username, c.quantity, p.name, p.description, p.price
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.username = %s
    """, (username,))
    items = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(items)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003)
