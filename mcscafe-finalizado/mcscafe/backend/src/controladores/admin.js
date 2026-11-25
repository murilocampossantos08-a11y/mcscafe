const bcrypt = require('bcrypt');
const db = require('../config/banco');
const { CARGOS } = require('../middlewares/autenticacao');
const v = require('../servicos/validacao');

const STATUS_CANCELADO = 5;
const STATUS_CONCLUIDO = 4;

function filtroPeriodo(periodo, coluna) {
  switch (periodo) {
    case 'semana':
      return `${coluna} >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`;
    case 'mes':
      return `${coluna} >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)`;
    case 'tudo':
      return '1 = 1';
    default:
      return `DATE(${coluna}) = CURDATE()`;
  }
}

exports.metricas = async (req, res) => {
  const periodo = ['dia', 'semana', 'mes', 'tudo'].includes(req.query.periodo) ? req.query.periodo : 'dia';
  const filtro = filtroPeriodo(periodo, 'p.data_pedido');

  const [[resumo]] = await db.query(
    `SELECT COUNT(*) AS totalVendas, COALESCE(SUM(p.valor_total), 0) AS faturamentoTotal, COUNT(DISTINCT p.usuario_id) AS clientesAtendidos
     FROM pedidos p WHERE p.status_id <> ? AND ${filtro}`,
    [STATUS_CANCELADO],
  );

  const [produtos] = await db.query(
    `SELECT COALESCE(ip.nome_produto, pr.nome) AS nome, SUM(ip.quantidade) AS unidades
     FROM itens_pedido ip
     JOIN pedidos p ON p.id = ip.pedido_id
     JOIN produtos pr ON pr.id = ip.produto_id
     WHERE p.status_id <> ? AND ${filtro}
     GROUP BY ip.produto_id, COALESCE(ip.nome_produto, pr.nome)
     ORDER BY unidades DESC, nome LIMIT 8`,
    [STATUS_CANCELADO],
  );

  const [porStatus] = await db.query(
    `SELECT s.id, s.nome, COUNT(p.id) AS total
     FROM status_pedido s LEFT JOIN pedidos p ON p.status_id = s.id AND ${filtro}
     GROUP BY s.id, s.nome ORDER BY s.id`,
  );

  res.json({
    periodo,
    totalVendas: Number(resumo.totalVendas),
    faturamentoTotal: Number(resumo.faturamentoTotal),
    clientesAtendidos: Number(resumo.clientesAtendidos),
    produtoMaisVendido: produtos[0]?.nome || '-',
    grafico: {
      labels: produtos.map((produto) => produto.nome),
      valores: produtos.map((produto) => Number(produto.unidades)),
    },
    pedidosPorStatus: porStatus.map((s) => ({ id: s.id, nome: s.nome, total: Number(s.total) })),
  });
};

exports.listarFuncionarios = async (req, res) => {
  const [linhas] = await db.query(
    `SELECT u.id, u.nome, u.email, u.telefone, u.foto_perfil, u.ativo, u.cargo_id, c.nome AS cargo
     FROM usuarios u JOIN cargos c ON c.id = u.cargo_id
     WHERE u.cargo_id IN (?, ?) ORDER BY u.ativo DESC, u.nome`,
    [CARGOS.ATENDENTE, CARGOS.ADMIN],
  );
  res.json({ funcionarios: linhas });
};

exports.detalharFuncionario = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Funcionário');
  const periodo = ['dia', 'semana', 'mes', 'tudo'].includes(req.query.periodo) ? req.query.periodo : 'dia';
  const filtro = filtroPeriodo(periodo, 'h.data_atualizacao');

  const [funcionarios] = await db.query(
    'SELECT u.id, u.nome, c.nome AS cargo FROM usuarios u JOIN cargos c ON c.id = u.cargo_id WHERE u.id = ? AND u.cargo_id IN (?, ?)',
    [id, CARGOS.ATENDENTE, CARGOS.ADMIN],
  );
  if (funcionarios.length === 0) {
    return res.status(404).json({ erro: 'Funcionário não encontrado.' });
  }

  const pedidosDoFuncionario = `SELECT DISTINCT h.pedido_id FROM historico_saida_pedidos h WHERE h.atualizado_por_usuario_id = ? AND h.status_novo_id = ? AND ${filtro}`;

  const [[resumo]] = await db.query(
    `SELECT COUNT(*) AS vendas, COALESCE(SUM(p.valor_total), 0) AS faturamento
     FROM pedidos p WHERE p.status_id = ? AND p.id IN (${pedidosDoFuncionario})`,
    [STATUS_CONCLUIDO, id, STATUS_CONCLUIDO],
  );

  const [produtos] = await db.query(
    `SELECT COALESCE(ip.nome_produto, pr.nome) AS nome, SUM(ip.quantidade) AS unidades
     FROM itens_pedido ip
     JOIN produtos pr ON pr.id = ip.produto_id
     JOIN pedidos p ON p.id = ip.pedido_id
     WHERE p.status_id = ? AND p.id IN (${pedidosDoFuncionario})
     GROUP BY ip.produto_id, COALESCE(ip.nome_produto, pr.nome)
     ORDER BY unidades DESC LIMIT 1`,
    [STATUS_CONCLUIDO, id, STATUS_CONCLUIDO],
  );

  res.json({
    id: funcionarios[0].id,
    nome: funcionarios[0].nome,
    cargo: funcionarios[0].cargo,
    periodo,
    vendas: Number(resumo.vendas),
    faturamento: Number(resumo.faturamento),
    produto: produtos[0]?.nome || '-',
  });
};

exports.criarFuncionario = async (req, res) => {
  const nome = v.texto(req.body.nome, 'Nome', { min: 2, max: 50 });
  const email = v.email(req.body.email);
  const senha = v.senha(req.body.senha);
  const telefone = v.telefone(req.body.telefone);
  const cargo = v.inteiro(req.body.cargo_id, 'Cargo', { min: CARGOS.ATENDENTE, max: CARGOS.ADMIN });

  const hash = await bcrypt.hash(senha, 10);
  const [resultado] = await db.query(
    'INSERT INTO usuarios (nome, email, senha, telefone, cargo_id) VALUES (?, ?, ?, ?, ?)',
    [nome, email, hash, telefone, cargo],
  );
  res.status(201).json({ mensagem: 'Funcionário cadastrado.', id: resultado.insertId });
};

exports.atualizarFuncionario = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Funcionário');
  const cargo = v.inteiro(req.body.cargo_id, 'Cargo', { min: CARGOS.CLIENTE, max: CARGOS.ADMIN });
  const ativo = v.booleano(req.body.ativo, true);

  if (id === req.usuario.id && (cargo !== CARGOS.ADMIN || !ativo)) {
    throw new v.ErroValidacao('Você não pode remover seu próprio acesso de administrador.', 409);
  }

  const [resultado] = await db.query('UPDATE usuarios SET cargo_id = ?, ativo = ? WHERE id = ?', [cargo, ativo, id]);
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }
  res.json({ mensagem: 'Funcionário atualizado.' });
};

function lerInsumo(body) {
  return {
    nome: v.texto(body.nome_insumo, 'Nome do insumo', { min: 2, max: 50 }),
    disponivel: v.dinheiro(body.quantidade_disponivel, 'Quantidade disponível', { min: 0, max: 9999999 }),
    unidade: v.texto(body.unidade_medida, 'Unidade de medida', { min: 1, max: 20 }),
    minima: v.dinheiro(body.quantidade_minima, 'Quantidade mínima', { min: 0, max: 9999999 }),
  };
}

exports.listarEstoque = async (req, res) => {
  const [linhas] = await db.query(
    'SELECT id, nome_insumo, quantidade_disponivel, unidade_medida, quantidade_minima, (quantidade_disponivel <= quantidade_minima) AS abaixo_do_minimo FROM estoque_insumos ORDER BY nome_insumo',
  );
  res.json({ insumos: linhas.map((linha) => ({ ...linha, abaixo_do_minimo: Boolean(linha.abaixo_do_minimo) })) });
};

exports.criarInsumo = async (req, res) => {
  const i = lerInsumo(req.body);
  const [resultado] = await db.query(
    'INSERT INTO estoque_insumos (nome_insumo, quantidade_disponivel, unidade_medida, quantidade_minima) VALUES (?, ?, ?, ?)',
    [i.nome, i.disponivel, i.unidade, i.minima],
  );
  res.status(201).json({ mensagem: 'Insumo cadastrado.', id: resultado.insertId });
};

exports.atualizarInsumo = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Insumo');
  const i = lerInsumo(req.body);
  const [resultado] = await db.query(
    'UPDATE estoque_insumos SET nome_insumo = ?, quantidade_disponivel = ?, unidade_medida = ?, quantidade_minima = ? WHERE id = ?',
    [i.nome, i.disponivel, i.unidade, i.minima, id],
  );
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ erro: 'Insumo não encontrado.' });
  }
  res.json({ mensagem: 'Insumo atualizado.' });
};

exports.removerInsumo = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Insumo');
  await db.query('DELETE FROM estoque_insumos WHERE id = ?', [id]);
  res.json({ mensagem: 'Insumo removido.' });
};
