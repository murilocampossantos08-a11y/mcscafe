const db = require('../config/banco-de-dados');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR2087531550300797-092413-a53fca049473a4f545bb1ec5ccfb0497-3715018948'
});

exports.criarPagamentoPix = async (req, res) => {
    const { itens, observacoes, forma_pagamento } = req.body;
    try {
        let valorTotal = 0;
        const itensProcessados = [];

        for (const item of itens) {
            const [prod] = await db.query('SELECT preco, nome FROM produtos WHERE id = ?', [item.produto_id]);
            if (prod.length > 0) {
                const preco = Number(prod[0].preco);
                valorTotal += preco * item.quantidade;
                itensProcessados.push({ ...item, nome: prod[0].nome, preco_unitario: preco });
            }
        }

        const [novoPedido] = await db.query(
            'INSERT INTO pedidos (usuario_id, status_id, valor_total, forma_pagamento, observacoes) VALUES (?, 1, ?, ?, ?)',
            [req.usuario.id, valorTotal, forma_pagamento || 'Pix', observacoes || '']
        );
        const pedidoId = novoPedido.insertId;

        for (const item of itensProcessados) {
            await db.query(
                'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                [pedidoId, item.produto_id, item.quantidade, item.preco_unitario, item.preco_unitario * item.quantidade]
            );
        }

        const preference = new Preference(mpClient);
        const mpRes = await preference.create({
            body: {
                items: itensProcessados.map(i => ({
                    title: `${i.nome} (Pedido #${pedidoId})`,
                    quantity: i.quantidade,
                    unit_price: i.preco_unitario,
                    currency_id: 'BRL'
                })),
                external_reference: String(pedidoId)
            }
        });

        return res.json({ pedido_id: pedidoId, checkout_url: mpRes.init_point });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
};
