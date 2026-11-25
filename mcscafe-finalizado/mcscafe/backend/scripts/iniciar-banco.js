const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { banco } = require('../src/config/ambiente');

const COLUNAS = [
  ['usuarios', 'ativo', 'BOOLEAN NOT NULL DEFAULT TRUE'],
  ['usuarios', 'reset_codigo_hash', 'CHAR(64) DEFAULT NULL'],
  ['usuarios', 'reset_expira', 'DATETIME DEFAULT NULL'],
  ['usuarios', 'reset_tentativas', 'INT NOT NULL DEFAULT 0'],
  ['pedidos', 'pagamento_status', "VARCHAR(20) NOT NULL DEFAULT 'pendente'"],
  ['pedidos', 'pagamento_id', 'VARCHAR(60) DEFAULT NULL'],
  ['itens_pedido', 'nome_produto', 'VARCHAR(100) DEFAULT NULL'],
];

function nomeSeguro(nome) {
  if (!/^[A-Za-z0-9_]+$/.test(nome)) {
    throw new Error('DB_NAME deve conter apenas letras, números e sublinhado.');
  }
  return nome;
}

async function colunaExiste(conexao, tabela, coluna) {
  const [linhas] = await conexao.query(
    'SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [tabela, coluna],
  );
  return linhas[0] || null;
}

async function main() {
  const nome = nomeSeguro(banco.nome);
  const conexao = await mysql.createConnection({
    host: banco.host,
    port: banco.porta,
    user: banco.usuario,
    password: banco.senha,
    multipleStatements: true,
    charset: 'utf8mb4',
    ssl: banco.ssl ? { rejectUnauthorized: banco.sslRejeitarNaoAutorizado } : undefined,
  });

  try {
    try {
      await conexao.query(`CREATE DATABASE IF NOT EXISTS \`${nome}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    } catch (erro) {
      console.warn(`Não foi possível criar o banco (${erro.code}). Usando o banco existente.`);
    }
    await conexao.query(`USE \`${nome}\``);

    const arquivo = path.join(__dirname, '../../banco/schema.sql');
    const sql = fs
      .readFileSync(arquivo, 'utf8')
      .replace(/^CREATE DATABASE.*;$/m, '')
      .replace(/^USE .*;$/m, '');
    await conexao.query(sql);

    for (const [tabela, coluna, definicao] of COLUNAS) {
      if (!(await colunaExiste(conexao, tabela, coluna))) {
        await conexao.query(`ALTER TABLE \`${tabela}\` ADD COLUMN \`${coluna}\` ${definicao}`);
        console.log(`Coluna adicionada: ${tabela}.${coluna}`);
      }
    }

    const foto = await colunaExiste(conexao, 'usuarios', 'foto_perfil');
    if (foto && foto.DATA_TYPE !== 'mediumtext') {
      await conexao.query('ALTER TABLE usuarios MODIFY foto_perfil MEDIUMTEXT DEFAULT NULL');
      console.log('Coluna ajustada: usuarios.foto_perfil');
    }

    console.log(`Banco "${nome}" pronto.`);
  } finally {
    await conexao.end();
  }
}

main().catch((erro) => {
  console.error('Falha ao iniciar o banco:', erro.message);
  process.exitCode = 1;
});
