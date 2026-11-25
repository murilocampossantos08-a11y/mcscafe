const bcrypt = require('bcrypt');
const db = require('../config/banco');
const v = require('../servicos/validacao');

const TAMANHO_MAXIMO_FOTO = 450000;

function formatoDaImagem(base64) {
  const inicio = Buffer.from(base64.slice(0, 24), 'base64');
  if (inicio.length >= 4 && inicio.readUInt32BE(0) === 0x89504e47) return 'png';
  if (inicio.length >= 3 && inicio[0] === 0xff && inicio[1] === 0xd8 && inicio[2] === 0xff) return 'jpeg';
  if (inicio.length >= 12 && inicio.toString('ascii', 0, 4) === 'RIFF' && inicio.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

exports.obterPerfil = async (req, res) => {
  const [linhas] = await db.query(
    'SELECT u.id, u.nome, u.email, u.telefone, u.foto_perfil, u.cargo_id, c.nome AS cargo, u.data_criacao FROM usuarios u JOIN cargos c ON c.id = u.cargo_id WHERE u.id = ?',
    [req.usuario.id],
  );
  res.json({ usuario: linhas[0] });
};

exports.atualizarPerfil = async (req, res) => {
  const nome = v.texto(req.body.nome, 'Nome', { min: 2, max: 50 });
  const telefone = v.telefone(req.body.telefone);
  await db.query('UPDATE usuarios SET nome = ?, telefone = ? WHERE id = ?', [nome, telefone, req.usuario.id]);
  res.json({ mensagem: 'Dados atualizados com sucesso.', usuario: { nome, telefone } });
};

exports.alterarSenha = async (req, res) => {
  const atual = typeof req.body.senhaAtual === 'string' ? req.body.senhaAtual : '';
  const nova = v.senha(req.body.novaSenha, 'Nova senha');

  const [linhas] = await db.query('SELECT senha FROM usuarios WHERE id = ?', [req.usuario.id]);
  if (!(await bcrypt.compare(atual, linhas[0].senha))) {
    throw new v.ErroValidacao('Senha atual incorreta.', 401);
  }

  await db.query('UPDATE usuarios SET senha = ? WHERE id = ?', [await bcrypt.hash(nova, 10), req.usuario.id]);
  res.json({ mensagem: 'Senha alterada com sucesso.' });
};

exports.atualizarFoto = async (req, res) => {
  const imagem = req.body.imagem;
  const padrao = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
  const partes = typeof imagem === 'string' ? padrao.exec(imagem) : null;

  if (!partes) {
    throw new v.ErroValidacao('Envie uma imagem PNG, JPEG ou WEBP.');
  }
  if (imagem.length > TAMANHO_MAXIMO_FOTO) {
    throw new v.ErroValidacao('A imagem é grande demais. Use uma foto menor.', 413);
  }
  if (formatoDaImagem(partes[2]) !== partes[1]) {
    throw new v.ErroValidacao('O arquivo enviado não é uma imagem válida.');
  }

  await db.query('UPDATE usuarios SET foto_perfil = ? WHERE id = ?', [imagem, req.usuario.id]);
  res.json({ mensagem: 'Foto atualizada com sucesso.', foto_perfil: imagem });
};

exports.removerFoto = async (req, res) => {
  await db.query('UPDATE usuarios SET foto_perfil = NULL WHERE id = ?', [req.usuario.id]);
  res.json({ mensagem: 'Foto removida.' });
};
