const { producao } = require('../config/ambiente');
const { ErroValidacao } = require('../servicos/validacao');

function naoEncontrado(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

function tratarErros(erro, req, res, next) {
  if (res.headersSent) return next(erro);

  if (erro instanceof ErroValidacao) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  if (erro.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Conteúdo enviado é grande demais.' });
  }

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido.' });
  }

  if (erro.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'Registro já existe.' });
  }

  if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ erro: 'Este registro está em uso e não pode ser removido. Desative-o.' });
  }

  const falhasDeConexao = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'];
  if (falhasDeConexao.includes(erro.code)) {
    console.error('Falha de conexão com o banco:', erro.code, erro.message);
    return res.status(503).json({ erro: 'Banco de dados indisponível no momento.' });
  }

  console.error(erro);
  res.status(500).json({ erro: producao ? 'Erro interno do servidor.' : erro.message });
}

module.exports = { naoEncontrado, tratarErros };
