# 💪 Vamshi Fitness — Backend API

Node.js + Express backend connected to SQL Server, MongoDB, and RabbitMQ.

---

## Project Structure

```
vamshi-backend/
├── src/
│   ├── server.js                  # Entry point
│   ├── config/
│   │   ├── sqlDb.js               # SQL Server connection + schema init
│   │   ├── mongoDb.js             # MongoDB connection + product seed
│   │   └── rabbitmq.js            # RabbitMQ connection + publish helper
│   ├── models/
│   │   └── Product.js             # Mongoose product schema
│   ├── middleware/
│   │   └── auth.js                # JWT auth middleware
│   ├── controllers/
│   │   ├── authController.js      # Register / Login / Profile
│   │   ├── productController.js   # Get products from MongoDB
│   │   └── orderController.js     # Place order → SQL + RabbitMQ event
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── orderRoutes.js
│   └── consumers/
│       └── orderConsumer.js       # RabbitMQ listener → send email
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## Quick Start

### 1. Copy and fill in the .env file
```bash
cp .env.example .env
# Edit .env — set your SMTP credentials
```

### 2. Start everything with Docker Compose
```bash
# From the project root (where docker-compose.yml lives)
docker-compose up --build
```

Services start order: SQL Server → MongoDB → RabbitMQ → Backend

### 3. Verify
```
http://localhost:5000/health       → API health check
http://localhost:5000/             → API root
http://localhost:15672             → RabbitMQ Management (guest/guest)
```

---

## API Reference

### Auth
| Method | Endpoint              | Auth | Description        |
|--------|-----------------------|------|--------------------|
| POST   | /api/auth/register    | No   | Register new user  |
| POST   | /api/auth/login       | No   | Login, get JWT     |
| GET    | /api/auth/profile     | Yes  | Get user profile   |

**Register body:**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "+91 98765 43210",
  "password": "mypassword123"
}
```

**Login body:**
```json
{
  "email": "ravi@example.com",
  "password": "mypassword123"
}
```

Both return:
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Ravi Kumar", "email": "..." }
}
```

---

### Products  (reads from MongoDB)
| Method | Endpoint                       | Auth | Description              |
|--------|--------------------------------|------|--------------------------|
| GET    | /api/products                  | No   | Get all products         |
| GET    | /api/products?category=weights | No   | Filter by category       |
| GET    | /api/products?search=barbell   | No   | Full-text search         |
| GET    | /api/products/categories       | No   | List all categories      |
| GET    | /api/products/:id              | No   | Single product by ID     |

---

### Orders  (saves to SQL Server, fires RabbitMQ event)
| Method | Endpoint                          | Auth | Description              |
|--------|-----------------------------------|------|--------------------------|
| POST   | /api/orders                       | Yes  | Place an order           |
| GET    | /api/orders/my-orders             | Yes  | All orders for this user |
| GET    | /api/orders/:orderNumber          | Yes  | Single order             |

**Place order body:**
```json
{
  "items": [
    { "name": "Olympic Barbell 20kg", "price": 4999, "qty": 1, "emoji": "🏋️" }
  ],
  "deliveryAddress": {
    "address": "Plot 12, HITEC City",
    "city": "Hyderabad",
    "state": "Telangana",
    "pinCode": "500081",
    "phone": "+91 98765 43210"
  },
  "paymentMethod": "upi"
}
```

---

## Order Flow

```
Customer places order
       │
       ▼
POST /api/orders  (authenticated)
       │
       ├──▶  Validate items + address
       │
       ├──▶  Calculate total (free delivery above ₹5000)
       │
       ├──▶  INSERT into SQL Server Orders table
       │
       └──▶  Publish ORDER_PLACED event → RabbitMQ
                       │
                       ▼
             orderConsumer.js (listening)
                       │
                       └──▶  Send HTML confirmation email via Nodemailer
```

---

## Email Setup

For Gmail, create an App Password:
1. Google Account → Security → 2-Step Verification → App Passwords
2. Generate a password for "Mail"
3. Set in .env:
   ```
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

For development/testing use [Mailtrap](https://mailtrap.io) — free SMTP sandbox.

---

## GCP Migration Guide

| Current (Docker)  | GCP Service                          |
|-------------------|--------------------------------------|
| SQL Server        | Cloud SQL for SQL Server             |
| MongoDB           | MongoDB Atlas or GCE VM              |
| RabbitMQ          | Google Cloud Pub/Sub                 |
| Consumer service  | Cloud Run (Pub/Sub push subscription)|
| Backend VM        | GCE VM or Cloud Run                  |
| Nodemailer SMTP   | SendGrid / Gmail API / Cloud Tasks   |



# Cloud function:

```
gcloud functions deploy sendEmail \
  --gen2 \
  --runtime=nodejs20 \
  --region=asia-south1 \
  --source=. \
  --entry-point=sendEmail \
  --trigger-topic=order-events \
  --set-env-vars=SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_SECURE=false,SMTP_USER=vamsir673@gmail.com,SMTP_PASS=...,EMAIL_FROM="Vamshi Fitness <...>"
```
