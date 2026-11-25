const mysql = require('mysql2/promise');
const { banco, producao } = require('./ambiente');

const pool = mysql.createPool({
  host: banco.host,
  port: banco.porta,
  user: banco.usuario,
  password: banco.senha,
  database: banco.nome,
  charset: 'utf8mb4',
  timezone: '-03:00',
  waitForConnections: true,
  connectionLimit: producao ? 5 : 10,
  queueLimit: 0,
  decimalNumbers: true,
  ssl: banco.ssl ? { rejectUnauthorized: banco.sslRejeitarNaoAutorizado } : undefined,
});

pool.on('connection', (conexao) => {
  conexao.query("SET time_zone = '-03:00'");
});

async function testarConexao() {
  const conexao = await pool.getConnection();
  try {
    await conexao.query('SELECT 1');
    return true;
  } finally {
    conexao.release();
  }
}

module.exports = pool;
module.exports.testarConexao = testarConexao;
