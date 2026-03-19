const sql = require('mssql');

const baseConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_HOST,
  port: parseInt(process.env.SQL_PORT) || 1433,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: { encrypt: false, trustServerCertificate: true },
};

let pool = null;

const connectSQL = async () => {
  try {
    // Step 1: connect to master
    const masterPool = await sql.connect({ ...baseConfig, database: 'master' });

    // Step 2: create VamshiFitnessDB if not exists
    await masterPool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'VamshiFitnessDB')
      CREATE DATABASE VamshiFitnessDB
    `);
    await masterPool.close();

    // Step 3: connect to VamshiFitnessDB
    pool = await sql.connect({ ...baseConfig, database: 'VamshiFitnessDB' });
    console.log('✅  SQL Server connected');
    await initSchema();
  } catch (err) {
    console.error('❌  SQL Server connection failed:', err.message);
    console.log('⏳  Retrying SQL Server in 5 s...');
    try { if (pool) await pool.close(); } catch {}
    pool = null;
    setTimeout(connectSQL, 5000);
  }
};

const initSchema = async () => {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
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

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
    CREATE TABLE Orders (
      id               UNIQUEIDENTIFIER  DEFAULT NEWID() PRIMARY KEY,
      order_number     NVARCHAR(30)      NOT NULL UNIQUE,
      user_id          UNIQUEIDENTIFIER  NOT NULL,
      user_email       NVARCHAR(150)     NOT NULL,
      user_name        NVARCHAR(100),
      items            NVARCHAR(MAX)     NOT NULL,
      subtotal         DECIMAL(10,2)     NOT NULL,
      delivery_fee     DECIMAL(10,2)     DEFAULT 0,
      total_amount     DECIMAL(10,2)     NOT NULL,
      payment_method   NVARCHAR(20)      NOT NULL,
      payment_status   NVARCHAR(20)      DEFAULT 'pending',
      order_status     NVARCHAR(30)      DEFAULT 'confirmed',
      delivery_address NVARCHAR(MAX)     NOT NULL,
      created_at       DATETIME          DEFAULT GETDATE(),
      updated_at       DATETIME          DEFAULT GETDATE()
    );
  `);
  console.log('✅  SQL schema ready (Users, Orders)');
};

const getPool = () => pool;
module.exports = { connectSQL, getPool };
