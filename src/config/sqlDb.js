const sql = require('mssql');

const sqlConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
  server: process.env.SQL_HOST,
  port: parseInt(process.env.SQL_PORT) || 1433,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: {
    encrypt: false,              // set true for Azure SQL in production
    trustServerCertificate: true,
  },
};

let pool = null;

const connectSQL = async () => {
  try {
    pool = await sql.connect(sqlConfig);
    console.log('✅  SQL Server connected');
    await initSchema();
  } catch (err) {
    console.error('❌  SQL Server connection failed:', err.message);
    console.log('⏳  Retrying SQL Server in 5 s...');
    setTimeout(connectSQL, 5000);
  }
};

// Create tables if they don't exist yet
const initSchema = async () => {
  // Users table — stores registered customer details
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sysobjects WHERE name='Users' AND xtype='U'
    )
    CREATE TABLE Users (
      id            UNIQUEIDENTIFIER  DEFAULT NEWID() PRIMARY KEY,
      name          NVARCHAR(100)     NOT NULL,
      email         NVARCHAR(150)     NOT NULL UNIQUE,
      phone         NVARCHAR(20),
      password_hash NVARCHAR(255)     NOT NULL,
      created_at    DATETIME          DEFAULT GETDATE(),
      updated_at    DATETIME          DEFAULT GETDATE()
    );
  `);

  // Orders table — stores every placed order
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U'
    )
    CREATE TABLE Orders (
      id               UNIQUEIDENTIFIER  DEFAULT NEWID() PRIMARY KEY,
      order_number     NVARCHAR(30)      NOT NULL UNIQUE,
      user_id          UNIQUEIDENTIFIER  NOT NULL,
      user_email       NVARCHAR(150)     NOT NULL,
      user_name        NVARCHAR(100),
      items            NVARCHAR(MAX)     NOT NULL,   -- JSON array of cart items
      subtotal         DECIMAL(10,2)     NOT NULL,
      delivery_fee     DECIMAL(10,2)     DEFAULT 0,
      total_amount     DECIMAL(10,2)     NOT NULL,
      payment_method   NVARCHAR(20)      NOT NULL,
      payment_status   NVARCHAR(20)      DEFAULT 'pending',
      order_status     NVARCHAR(30)      DEFAULT 'confirmed',
      delivery_address NVARCHAR(MAX)     NOT NULL,   -- JSON object
      created_at       DATETIME          DEFAULT GETDATE(),
      updated_at       DATETIME          DEFAULT GETDATE()
    );
  `);

  console.log('✅  SQL schema ready (Users, Orders)');
};

const getPool = () => pool;

module.exports = { connectSQL, getPool };
