const jwt = require('jsonwebtoken');
const db = require('../config/banco');
const { jwtSecret, jwtExpira } = require('../config/ambiente');

const CARGOS = { CLIENTE: 1, ATENDENTE: 2, ADMIN: 3 };

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, cargo_id: usuario.cargo_id }, jwtSecret, { expiresIn: jwtExpira });
}

async function carregarUsuario(req) {
  const cabecalho = req.headers.authorization || '';
  const [tipo, token] = cabecalho.split(' ');
  if (tipo !== 'Bearer' || !token) return { token: false };

  let dados;
  try {
    dados = jwt.verify(token, jwtSecret);
  } catch {
    return { token: true, usuario: null };
  }

  const [linhas] = await db.query(
    'SELECT id, nome, email, telefone, cargo_id, ativo FROM usuarios WHERE id = ?',
    [dados.id],
  );
  const usuario = linhas[0];
  if (!usuario || !usuario.ativo) return { token: true, usuario: null };
  return { token: true, usuario };
}

async function autenticar(req, res, next) {
  const { token, usuario } = await carregarUsuario(req);
  if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' });
  if (!usuario) return res.status(401).json({ erro: 'Sessão inválida ou expirada. Entre novamente.' });
  req.usuario = usuario;
  next();
}

function exigirCargo(...cargos) {
  return (req, res, next) => {
    if (!cargos.includes(req.usuario.cargo_id)) {
      return res.status(403).json({ erro: 'Você não tem permissão para esta ação.' });
    }
    next();
  };
}

module.exports = { CARGOS, gerarToken, autenticar, exigirCargo };
