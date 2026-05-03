const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'qms_ticketkeypad',
  port:            process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit:      0
});

const promisePool = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ DB Connection failed:', err.message);
  } else {
    console.log('✅ MySQL Connected to:', process.env.DB_NAME || 'qms_ticketkeypad');
    connection.release();
  }
});

module.exports = promisePool;