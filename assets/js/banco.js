const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'scherma.sql',
  port: process.env.DB_PORT || '3306',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexão com o MySQL realizada com sucesso!');
        connection.release();
    }catch (erro){
      console.error('❌ falha na conexão com o Mysql', error.message);
    }
    }
    testConnection();
module.exports = pool;
