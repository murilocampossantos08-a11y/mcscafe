const db = require('../config/banco');
const mercadoPago = require('../servicos/mercado-pago');
const { STATUS, buscarItens } = require('./pedidos');
const v = require('../servicos/validacao');

exports.configuracao = (req, res) => {
  res.json({ pagamentoOnline: mercadoPago.configurado() });
};

exports.iniciarCheckout = async (req, res) => {
  if (!mercadoPago.configurado()) {
    return res.status(503).json({ erro: 'Pagamento online indisponível. Pague na retirada.' });
  }

  const id = v.inteiro(req.params.pedidoId, 'Pedido');
  const [pedidos] = await db.query(
    'SELECT id, status_id, pagamento_status FROM pedidos WHERE id = ? AND usuario_id = ?',
    [id, req.usuario.id],
  );
  const pedido = pedidos[0];
  if (!pedido) {
    return res.status(404).json({ erro: 'Pedido não encontrado.' });
  }
  if (pedido.status_id === STATUS.CANCELADO || pedido.pagamento_status === 'approved') {
    throw new v.ErroValidacao('Este pedido não pode ser pago agora.', 409);
  }

  const itens = (await buscarItens([id])).get(id) || [];
  const preferencia = await mercadoPago.criarPreferencia(id, itens);
  await db.query("UPDATE pedidos SET forma_pagamento = 'Mercado Pago' WHERE id = ?", [id]);
  res.json({ checkout_url: preferencia.url });
};

exports.webhook = async (req, res) => {
  const tipo = req.body?.type || req.query.type || req.query.topic;
  const dataId = req.body?.data?.id || req.query['data.id'] || req.query.id;

  if (tipo !== 'payment' || !dataId) {
    return res.sendStatus(200);
  }
  if (!mercadoPago.configurado()) {
    return res.sendStatus(503);
  }
  if (!mercadoPago.assinaturaValida(req, dataId)) {
    return res.sendStatus(401);
  }

  const pagamento = await mercadoPago.buscarPagamento(dataId);
  const pedidoId = Number(pagamento.external_reference);
  if (!Number.isInteger(pedidoId)) {
    return res.sendStatus(200);
  }

  const status = String(pagamento.status || 'pendente').slice(0, 20);
  await db.query('UPDATE pedidos SET pagamento_status = ?, pagamento_id = ? WHERE id = ?', [status, String(pagamento.id), pedidoId]);

  if (status === 'approved') {
    const [alterados] = await db.query('UPDATE pedidos SET status_id = ? WHERE id = ? AND status_id = ?', [
      STATUS.EM_PREPARO,
      pedidoId,
      STATUS.PENDENTE,
    ]);
    if (alterados.affectedRows > 0) {
      await db.query(
        'INSERT INTO historico_saida_pedidos (pedido_id, status_anterior_id, status_novo_id, atualizado_por_usuario_id) VALUES (?, ?, ?, NULL)',
        [pedidoId, STATUS.PENDENTE, STATUS.EM_PREPARO],
      );
    }
  }

  res.sendStatus(200);
};
