const db = require('../config/banco');
const mercadoPago = require('../servicos/mercado-pago');
const v = require('../servicos/validacao');

const STATUS = { PENDENTE: 1, EM_PREPARO: 2, PRONTO: 3, CONCLUIDO: 4, CANCELADO: 5 };
const MAX_ITENS = 40;
const MAX_QUANTIDADE = 50;

async function buscarItens(pedidoIds) {
  if (pedidoIds.length === 0) return new Map();
  const [itens] = await db.query(
    'SELECT pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal FROM itens_pedido WHERE pedido_id IN (?) ORDER BY id',
    [pedidoIds],
  );
  const mapa = new Map();
  for (const item of itens) {
    if (!mapa.has(item.pedido_id)) mapa.set(item.pedido_id, []);
    mapa.get(item.pedido_id).push(item);
  }
  return mapa;
}

async function anexarItens(pedidos) {
  const mapa = await buscarItens(pedidos.map((pedido) => pedido.id));
  return pedidos.map((pedido) => ({ ...pedido, itens: mapa.get(pedido.id) || [] }));
}

async function resolverItens(brutos) {
  if (!Array.isArray(brutos) || brutos.length === 0) {
    throw new v.ErroValidacao('O carrinho está vazio.');
  }
  if (brutos.length > MAX_ITENS) {
    throw new v.ErroValidacao('Itens demais no pedido.');
  }

  const pedidos = new Map();
  const ausentes = [];

  for (const bruto of brutos) {
    const quantidade = v.inteiro(bruto?.quantidade, 'Quantidade', { min: 1, max: MAX_QUANTIDADE });
    let produto;

    if (bruto.produto_id !== undefined && bruto.produto_id !== null) {
      const [linhas] = await db.query('SELECT id, nome, preco FROM produtos WHERE id = ? AND disponivel = TRUE', [
        v.inteiro(bruto.produto_id, 'Produto'),
      ]);
      produto = linhas[0];
    } else if (typeof bruto.nome === 'string') {
      const [linhas] = await db.query('SELECT id, nome, preco FROM produtos WHERE nome = ? AND disponivel = TRUE LIMIT 1', [
        bruto.nome.trim(),
      ]);
      produto = linhas[0];
    }

    if (!produto) {
      ausentes.push(bruto?.nome || `#${bruto?.produto_id}`);
      continue;
    }

    const atual = pedidos.get(produto.id);
    const total = (atual?.quantidade || 0) + quantidade;
    if (total > MAX_QUANTIDADE) {
      throw new v.ErroValidacao(`Quantidade máxima por produto: ${MAX_QUANTIDADE}.`);
    }
    pedidos.set(produto.id, {
      produto_id: produto.id,
      nome_produto: produto.nome,
      preco_unitario: Number(produto.preco),
      quantidade: total,
    });
  }

  if (ausentes.length > 0) {
    throw new v.ErroValidacao(`Produtos indisponíveis: ${ausentes.join(', ')}.`);
  }

  return [...pedidos.values()].map((item) => ({
    ...item,
    subtotal: Math.round(item.preco_unitario * item.quantidade * 100) / 100,
  }));
}

exports.criar = async (req, res) => {
  const itens = await resolverItens(req.body.itens);
  const observacoes = v.texto(req.body.observacoes, 'Observações', { max: 500, opcional: true });
  const total = Math.round(itens.reduce((soma, item) => soma + item.subtotal, 0) * 100) / 100;
  const online = req.body.pagamento === 'online' && mercadoPago.configurado();
  const forma = online ? 'Mercado Pago' : 'Na retirada';

  const conexao = await db.getConnection();
  let pedidoId;
  try {
    await conexao.beginTransaction();
    const [pedido] = await conexao.query(
      'INSERT INTO pedidos (usuario_id, status_id, valor_total, forma_pagamento, observacoes) VALUES (?, ?, ?, ?, ?)',
      [req.usuario.id, STATUS.PENDENTE, total, forma, observacoes],
    );
    pedidoId = pedido.insertId;
    await conexao.query(
      'INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal) VALUES ?',
      [itens.map((item) => [pedidoId, item.produto_id, item.nome_produto, item.quantidade, item.preco_unitario, item.subtotal])],
    );
    await conexao.query(
      'INSERT INTO historico_saida_pedidos (pedido_id, status_anterior_id, status_novo_id, atualizado_por_usuario_id) VALUES (?, NULL, ?, ?)',
      [pedidoId, STATUS.PENDENTE, req.usuario.id],
    );
    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }

  const resposta = {
    mensagem: 'Pedido registrado com sucesso.',
    pedido: { id: pedidoId, valor_total: total, forma_pagamento: forma, status: 'Pendente' },
  };

  if (online) {
    try {
      const preferencia = await mercadoPago.criarPreferencia(pedidoId, itens);
      resposta.checkout_url = preferencia.url;
    } catch (erro) {
      console.error('Falha ao criar preferência no Mercado Pago:', erro.message);
      resposta.checkout_erro = 'Não foi possível abrir o pagamento online. Pague na retirada ou tente novamente em Minha conta.';
    }
  }

  res.status(201).json(resposta);
};

exports.listarMeus = async (req, res) => {
  const [pedidos] = await db.query(
    `SELECT p.id, p.valor_total, p.forma_pagamento, p.pagamento_status, p.observacoes, p.data_pedido, p.status_id, s.nome AS status
     FROM pedidos p JOIN status_pedido s ON s.id = p.status_id
     WHERE p.usuario_id = ? ORDER BY p.data_pedido DESC, p.id DESC LIMIT 50`,
    [req.usuario.id],
  );
  res.json({ pedidos: await anexarItens(pedidos) });
};

exports.obterMeu = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Pedido');
  const [pedidos] = await db.query(
    `SELECT p.id, p.valor_total, p.forma_pagamento, p.pagamento_status, p.observacoes, p.data_pedido, p.status_id, s.nome AS status
     FROM pedidos p JOIN status_pedido s ON s.id = p.status_id
     WHERE p.id = ? AND p.usuario_id = ?`,
    [id, req.usuario.id],
  );
  if (pedidos.length === 0) {
    return res.status(404).json({ erro: 'Pedido não encontrado.' });
  }
  const [pedido] = await anexarItens(pedidos);
  res.json({ pedido });
};

exports.cancelarMeu = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Pedido');
  const [pedidos] = await db.query('SELECT status_id, pagamento_status FROM pedidos WHERE id = ? AND usuario_id = ?', [id, req.usuario.id]);
  if (pedidos.length === 0) {
    return res.status(404).json({ erro: 'Pedido não encontrado.' });
  }
  if (pedidos[0].status_id !== STATUS.PENDENTE || pedidos[0].pagamento_status === 'approved') {
    throw new v.ErroValidacao('Só é possível cancelar pedidos pendentes e ainda não pagos.', 409);
  }
  await mudarStatus(id, pedidos[0].status_id, STATUS.CANCELADO, req.usuario.id);
  res.json({ mensagem: 'Pedido cancelado.' });
};

async function mudarStatus(pedidoId, anterior, novo, usuarioId) {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();
    await conexao.query('UPDATE pedidos SET status_id = ? WHERE id = ?', [novo, pedidoId]);
    await conexao.query(
      'INSERT INTO historico_saida_pedidos (pedido_id, status_anterior_id, status_novo_id, atualizado_por_usuario_id) VALUES (?, ?, ?, ?)',
      [pedidoId, anterior, novo, usuarioId],
    );
    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

exports.listarAdmin = async (req, res) => {
  const filtros = [];
  const valores = [];

  if (req.query.status) {
    filtros.push('p.status_id = ?');
    valores.push(v.inteiro(req.query.status, 'Status', { min: 1, max: 5 }));
  }
  if (req.query.data === 'hoje') {
    filtros.push('DATE(p.data_pedido) = CURDATE()');
  }

  const onde = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
  const [pedidos] = await db.query(
    `SELECT p.id, p.valor_total, p.forma_pagamento, p.pagamento_status, p.observacoes, p.data_pedido, p.status_id, s.nome AS status, u.nome AS cliente, u.telefone
     FROM pedidos p
     JOIN status_pedido s ON s.id = p.status_id
     JOIN usuarios u ON u.id = p.usuario_id
     ${onde}
     ORDER BY p.data_pedido DESC, p.id DESC LIMIT 200`,
    valores,
  );
  res.json({ pedidos: await anexarItens(pedidos) });
};

exports.atualizarStatus = async (req, res) => {
  const id = v.inteiro(req.params.id, 'Pedido');
  const novo = v.inteiro(req.body.status_id, 'Status', { min: 1, max: 5 });

  const [atual] = await db.query('SELECT status_id FROM pedidos WHERE id = ?', [id]);
  if (atual.length === 0) {
    return res.status(404).json({ erro: 'Pedido não encontrado.' });
  }
  if (atual[0].status_id === novo) {
    return res.json({ mensagem: 'O pedido já está neste status.' });
  }

  await mudarStatus(id, atual[0].status_id, novo, req.usuario.id);
  res.json({ mensagem: 'Status do pedido atualizado com sucesso.' });
};

exports.listarStatus = async (req, res) => {
  const [linhas] = await db.query('SELECT id, nome FROM status_pedido ORDER BY id');
  res.json({ status: linhas });
};

exports.STATUS = STATUS;
exports.buscarItens = buscarItens;
