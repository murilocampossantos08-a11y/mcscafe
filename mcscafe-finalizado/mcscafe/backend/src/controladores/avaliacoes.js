const db = require('../config/banco');
const v = require('../servicos/validacao');

exports.listarPublicas = async (req, res) => {
  const [linhas] = await db.query(
    `SELECT a.id, a.nota, a.comentario, a.data_criacao, u.nome, u.foto_perfil
     FROM avaliacoes a JOIN usuarios u ON u.id = a.usuario_id
     WHERE a.aprovada = TRUE ORDER BY a.data_atualizacao DESC LIMIT 20`,
  );
  res.json({ avaliacoes: linhas });
};

exports.obterMinha = async (req, res) => {
  const [linhas] = await db.query('SELECT nota, comentario, aprovada FROM avaliacoes WHERE usuario_id = ?', [req.usuario.id]);
  res.json({ avaliacao: linhas[0] || null });
};

exports.salvarMinha = async (req, res) => {
  const nota = v.inteiro(req.body.nota, 'Nota', { min: 1, max: 5 });
  const comentario = v.texto(req.body.comentario, 'Comentário', { min: 5, max: 500 });
  await db.query(
    `INSERT INTO avaliacoes (usuario_id, nota, comentario, aprovada) VALUES (?, ?, ?, FALSE)
     ON DUPLICATE KEY UPDATE nota = VALUES(nota), comentario = VALUES(comentario), aprovada = FALSE`,
    [req.usuario.id, nota, comentario],
  );
  res.status(201).json({ mensagem: 'Avaliação enviada. Ela aparece no site depois de aprovada.' });
};

exports.listarAdmin = async (req, res) => {
  const [linhas] = await db.query(
    `SELECT a.id, a.nota, a.comentario, a.aprovada, a.data_atualizacao, u.nome, u.email
     FROM avaliacoes a JOIN usuarios u ON u.id = a.usuario_id
     ORDER BY a.aprovada, a.data_atualizacao DESC LIMIT 200`,
  );
  res.json({ avaliacoes: linhas });
};

exports.moderar = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Avaliação');
  const aprovada = v.booleano(req.body.aprovada);
  if (aprovada === undefined) throw new v.ErroValidacao('Informe se a avaliação está aprovada.');
  const [resultado] = await db.query('UPDATE avaliacoes SET aprovada = ? WHERE id = ?', [aprovada, id]);
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ erro: 'Avaliação não encontrada.' });
  }
  res.json({ mensagem: aprovada ? 'Avaliação aprovada.' : 'Avaliação ocultada.' });
};

exports.removerAdmin = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Avaliação');
  await db.query('DELETE FROM avaliacoes WHERE id = ?', [id]);
  res.json({ mensagem: 'Avaliação removida.' });
};
