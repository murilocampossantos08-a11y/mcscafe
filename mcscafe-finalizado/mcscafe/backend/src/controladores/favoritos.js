const db = require('../config/banco');
const v = require('../servicos/validacao');

exports.listar = async (req, res) => {
  const [linhas] = await db.query(
    `SELECT p.id, p.nome, p.descricao, p.preco, p.imagem_url, p.disponivel, c.nome AS categoria
     FROM favoritos f
     JOIN produtos p ON p.id = f.produto_id
     JOIN categorias c ON c.id = p.categoria_id
     WHERE f.usuario_id = ? ORDER BY f.data_criacao DESC`,
    [req.usuario.id],
  );
  res.json({ favoritos: linhas });
};

exports.adicionar = async (req, res) => {
  const produtoId = v.inteiro(req.body.produto_id, 'Produto');
  const [produto] = await db.query('SELECT id FROM produtos WHERE id = ?', [produtoId]);
  if (produto.length === 0) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  await db.query('INSERT IGNORE INTO favoritos (usuario_id, produto_id) VALUES (?, ?)', [req.usuario.id, produtoId]);
  res.status(201).json({ mensagem: 'Produto adicionado aos favoritos.' });
};

exports.remover = async (req, res) => {
  const produtoId = v.inteiro(req.params.produtoId, 'Produto');
  await db.query('DELETE FROM favoritos WHERE usuario_id = ? AND produto_id = ?', [req.usuario.id, produtoId]);
  res.json({ mensagem: 'Produto removido dos favoritos.' });
};
