const crypto = require('crypto');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { mercadoPago, baseUrl } = require('../config/ambiente');

let cliente = null;

function configurado() {
  return Boolean(mercadoPago.token);
}

function obterCliente() {
  if (!cliente) {
    cliente = new MercadoPagoConfig({ accessToken: mercadoPago.token });
  }
  return cliente;
}

async function criarPreferencia(pedidoId, itens) {
  const retorno = `${baseUrl}/paginas/pedido-status.html?pedido=${pedidoId}`;
  const corpo = {
    items: itens.map((item) => ({
      id: String(item.produto_id),
      title: item.nome_produto,
      quantity: item.quantidade,
      unit_price: Number(item.preco_unitario),
      currency_id: 'BRL',
    })),
    external_reference: String(pedidoId),
    statement_descriptor: 'MCS CAFE',
  };

  if (baseUrl) {
    corpo.back_urls = { success: retorno, pending: retorno, failure: retorno };
    corpo.notification_url = `${baseUrl}/api/pagamento/webhook`;
    if (baseUrl.startsWith('https://')) corpo.auto_return = 'approved';
  }

  const preferencia = await new Preference(obterCliente()).create({ body: corpo });
  return { id: preferencia.id, url: preferencia.init_point };
}

async function buscarPagamento(id) {
  return new Payment(obterCliente()).get({ id });
}

function assinaturaValida(req, dataId) {
  if (!mercadoPago.segredoWebhook) return true;
  const assinatura = req.headers['x-signature'] || '';
  const requisicao = req.headers['x-request-id'] || '';
  const partes = Object.fromEntries(
    assinatura.split(',').map((parte) => {
      const [chave, valor] = parte.split('=');
      return [String(chave).trim(), String(valor || '').trim()];
    }),
  );
  if (!partes.ts || !partes.v1) return false;
  const manifesto = `id:${String(dataId).toLowerCase()};request-id:${requisicao};ts:${partes.ts};`;
  const esperado = crypto.createHmac('sha256', mercadoPago.segredoWebhook).update(manifesto).digest('hex');
  const recebido = Buffer.from(partes.v1);
  const calculado = Buffer.from(esperado);
  return recebido.length === calculado.length && crypto.timingSafeEqual(recebido, calculado);
}

module.exports = { configurado, criarPreferencia, buscarPagamento, assinaturaValida };
