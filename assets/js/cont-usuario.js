const db = require('../config/banco-de-dados');

exports.obterPerfil = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT u.id, u.nome, u.email, u.telefone, u.foto_perfil, c.nome AS cargo FROM usuarios u JOIN cargos c ON u.cargo_id = c.id WHERE u.id = ?',
            [req.usuario.id]
        );
        if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
        return res.json(rows[0]);
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
};

exports.atualizarFoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
        const caminhoFoto = `/uploads/${req.file.filename}`;

        await db.query('UPDATE usuarios SET foto_perfil = ? WHERE id = ?', [caminhoFoto, req.usuario.id]);
        return res.json({ mensagem: 'Foto atualizada com sucesso.', foto_perfil: caminhoFoto });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
};

const db = require('../config/banco-de-dados');

exports.listarPedidos = async (req, res) => {
    try {
        const [pedidos] = await db.query(`
            SELECT p.id, p.valor_total, p.forma_pagamento, p.observacoes, p.data_pedido, s.nome AS status, u.nome AS cliente
            FROM pedidos p
            JOIN status_pedido s ON p.status_id = s.id
            JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.data_pedido DESC
        `);
        return res.json(pedidos);
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
};

exports.atualizarStatusPedido = async (req, res) => {
    const { id } = req.params;
    const { status_id } = req.body;
    try {
        const [pedidoAtual] = await db.query('SELECT status_id FROM pedidos WHERE id = ?', [id]);
        if (pedidoAtual.length === 0) return res.status(404).json({ erro: 'Pedido não encontrado.' });

        const statusAnterior = pedidoAtual[0].status_id;

        await db.query('UPDATE pedidos SET status_id = ? WHERE id = ?', [status_id, id]);
        await db.query(
            'INSERT INTO historico_saida_pedidos (pedido_id, status_anterior_id, status_novo_id, atualizado_por_usuario_id) VALUES (?, ?, ?, ?)',
            [id, statusAnterior, status_id, req.usuario.id]
        );

        return res.json({ mensagem: 'Status do pedido atualizado com sucesso.' });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
};

exports.listarEstoque = async (req, res) => {
    try {
        const [insumos] = await db.query('SELECT * FROM estoque_insumos');
        return res.json(insumos);
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
};
