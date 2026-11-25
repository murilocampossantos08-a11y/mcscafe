const db = require('../config/banco');
const v = require('../servicos/validacao');

const CAMPOS = 'p.id, p.categoria_id, c.nome AS categoria, p.nome, p.descricao, p.preco, p.imagem_url, p.disponivel';

exports.listarCategorias = async (req, res) => {
  const [linhas] = await db.query('SELECT id, nome, descricao FROM categorias ORDER BY id');
  res.json({ categorias: linhas });
};

exports.listarPublico = async (req, res) => {
  const filtros = ['p.disponivel = TRUE'];
  const valores = [];
  if (req.query.categoria) {
    filtros.push('p.categoria_id = ?');
    valores.push(v.inteiro(req.query.categoria, 'Categoria'));
  }
  const [linhas] = await db.query(
    `SELECT ${CAMPOS} FROM produtos p JOIN categorias c ON c.id = p.categoria_id WHERE ${filtros.join(' AND ')} ORDER BY p.categoria_id, p.id`,
    valores,
  );
  res.json({ produtos: linhas });
};

exports.listarAdmin = async (req, res) => {
  const [linhas] = await db.query(
    `SELECT ${CAMPOS} FROM produtos p JOIN categorias c ON c.id = p.categoria_id ORDER BY p.categoria_id, p.id`,
  );
  res.json({ produtos: linhas });
};

async function lerCorpo(body) {
  const categoriaId = v.inteiro(body.categoria_id, 'Categoria');
  const [categoria] = await db.query('SELECT id FROM categorias WHERE id = ?', [categoriaId]);
  if (categoria.length === 0) {
    throw new v.ErroValidacao('Categoria não encontrada.');
  }
  return {
    categoria_id: categoriaId,
    nome: v.texto(body.nome, 'Nome', { min: 2, max: 100 }),
    descricao: v.texto(body.descricao, 'Descrição', { max: 1000, opcional: true }),
    preco: v.dinheiro(body.preco, 'Preço'),
    imagem_url: v.caminhoImagem(body.imagem_url),
    disponivel: v.booleano(body.disponivel, true),
  };
}

exports.criar = async (req, res) => {
  const p = await lerCorpo(req.body);
  const [resultado] = await db.query(
    'INSERT INTO produtos (categoria_id, nome, descricao, preco, imagem_url, disponivel) VALUES (?, ?, ?, ?, ?, ?)',
    [p.categoria_id, p.nome, p.descricao, p.preco, p.imagem_url, p.disponivel],
  );
  res.status(201).json({ mensagem: 'Produto criado.', id: resultado.insertId });
};

exports.atualizar = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Produto');
  const p = await lerCorpo(req.body);
  const [resultado] = await db.query(
    'UPDATE produtos SET categoria_id = ?, nome = ?, descricao = ?, preco = ?, imagem_url = ?, disponivel = ? WHERE id = ?',
    [p.categoria_id, p.nome, p.descricao, p.preco, p.imagem_url, p.disponivel, id],
  );
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  res.json({ mensagem: 'Produto atualizado.' });
};

exports.alterarDisponibilidade = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Produto');
  const disponivel = v.booleano(req.body.disponivel);
  if (disponivel === undefined) throw new v.ErroValidacao('Informe a disponibilidade.');
  const [resultado] = await db.query('UPDATE produtos SET disponivel = ? WHERE id = ?', [disponivel, id]);
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  res.json({ mensagem: disponivel ? 'Produto ativado.' : 'Produto desativado.' });
};

exports.remover = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Produto');
  const [resultado] = await db.query('DELETE FROM produtos WHERE id = ?', [id]);
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  res.json({ mensagem: 'Produto removido.' });
};
