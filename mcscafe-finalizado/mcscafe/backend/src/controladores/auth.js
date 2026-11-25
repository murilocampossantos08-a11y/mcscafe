const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/banco');
const { producao } = require('../config/ambiente');
const { gerarToken, CARGOS } = require('../middlewares/autenticacao');
const email = require('../servicos/email');
const v = require('../servicos/validacao');

const MENSAGEM_GENERICA = 'Se o e-mail estiver cadastrado, enviaremos um código de verificação.';
const MAX_TENTATIVAS_CODIGO = 5;

function publico(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
    cargo_id: usuario.cargo_id,
    cargo: usuario.cargo || null,
  };
}

function hashCodigo(codigo) {
  return crypto.createHash('sha256').update(String(codigo)).digest('hex');
}

exports.registrar = async (req, res) => {
  const nome = v.texto(req.body.nome, 'Nome', { min: 2, max: 50 });
  const emailUsuario = v.email(req.body.email);
  const senha = v.senha(req.body.senha);
  const telefone = v.telefone(req.body.telefone);

  const [existente] = await db.query('SELECT id FROM usuarios WHERE email = ?', [emailUsuario]);
  if (existente.length > 0) {
    throw new v.ErroValidacao('E-mail já cadastrado.', 409);
  }

  const hash = await bcrypt.hash(senha, 10);
  const [resultado] = await db.query(
    'INSERT INTO usuarios (nome, email, senha, telefone, cargo_id) VALUES (?, ?, ?, ?, ?)',
    [nome, emailUsuario, hash, telefone, CARGOS.CLIENTE],
  );

  const usuario = { id: resultado.insertId, nome, email: emailUsuario, telefone, cargo_id: CARGOS.CLIENTE, cargo: 'Cliente' };
  res.status(201).json({ token: gerarToken(usuario), usuario: publico(usuario) });
};

exports.login = async (req, res) => {
  const emailUsuario = v.email(req.body.email);
  const senha = typeof req.body.senha === 'string' ? req.body.senha : '';

  const [linhas] = await db.query(
    'SELECT u.id, u.nome, u.email, u.telefone, u.senha, u.cargo_id, u.ativo, c.nome AS cargo FROM usuarios u JOIN cargos c ON c.id = u.cargo_id WHERE u.email = ?',
    [emailUsuario],
  );
  const usuario = linhas[0];
  const valida = usuario && usuario.ativo && (await bcrypt.compare(senha, usuario.senha));
  if (!valida) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  res.json({ token: gerarToken(usuario), usuario: publico(usuario) });
};

exports.eu = async (req, res) => {
  const [linhas] = await db.query(
    'SELECT u.id, u.nome, u.email, u.telefone, u.cargo_id, c.nome AS cargo FROM usuarios u JOIN cargos c ON c.id = u.cargo_id WHERE u.id = ?',
    [req.usuario.id],
  );
  res.json({ usuario: publico(linhas[0]) });
};

exports.solicitarRecuperacao = async (req, res) => {
  const emailUsuario = v.email(req.body.email);
  const resposta = { mensagem: MENSAGEM_GENERICA };

  const [linhas] = await db.query('SELECT id, nome FROM usuarios WHERE email = ? AND ativo = TRUE', [emailUsuario]);
  const usuario = linhas[0];
  if (!usuario) return res.json(resposta);

  const codigo = String(crypto.randomInt(100000, 1000000));
  await db.query(
    'UPDATE usuarios SET reset_codigo_hash = ?, reset_expira = DATE_ADD(NOW(), INTERVAL 15 MINUTE), reset_tentativas = 0 WHERE id = ?',
    [hashCodigo(codigo), usuario.id],
  );

  const enviado = await email.enviar({
    para: emailUsuario,
    assunto: 'MCS Café: código para redefinir sua senha',
    texto: `Olá, ${usuario.nome}.\n\nSeu código para redefinir a senha é ${codigo}. Ele vale por 15 minutos.\n\nSe você não pediu isso, ignore este e-mail.`,
  });

  if (!enviado && !producao) {
    console.log(`[recuperação de senha] código para ${emailUsuario}: ${codigo}`);
    resposta.codigo_desenvolvimento = codigo;
  }

  if (!enviado && producao) {
    console.error('Recuperação de senha pedida, mas o SMTP não está configurado.');
  }

  res.json(resposta);
};

exports.redefinirSenha = async (req, res) => {
  const emailUsuario = v.email(req.body.email);
  const codigo = v.texto(String(req.body.codigo ?? ''), 'Código', { min: 6, max: 6 });
  const novaSenha = v.senha(req.body.novaSenha, 'Nova senha');
  const invalido = new v.ErroValidacao('Código inválido ou expirado.', 400);

  const [linhas] = await db.query(
    'SELECT id, reset_codigo_hash, reset_tentativas, (reset_expira > NOW()) AS valido FROM usuarios WHERE email = ? AND ativo = TRUE',
    [emailUsuario],
  );
  const usuario = linhas[0];
  if (!usuario || !usuario.reset_codigo_hash || !usuario.valido || usuario.reset_tentativas >= MAX_TENTATIVAS_CODIGO) {
    throw invalido;
  }

  const recebido = Buffer.from(hashCodigo(codigo));
  const guardado = Buffer.from(usuario.reset_codigo_hash);
  const confere = recebido.length === guardado.length && crypto.timingSafeEqual(recebido, guardado);
  if (!confere) {
    await db.query('UPDATE usuarios SET reset_tentativas = reset_tentativas + 1 WHERE id = ?', [usuario.id]);
    throw invalido;
  }

  const hash = await bcrypt.hash(novaSenha, 10);
  await db.query(
    'UPDATE usuarios SET senha = ?, reset_codigo_hash = NULL, reset_expira = NULL, reset_tentativas = 0 WHERE id = ?',
    [hash, usuario.id],
  );
  res.json({ mensagem: 'Senha alterada com sucesso. Faça login com a nova senha.' });
};
