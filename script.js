// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const JWT_SECRET = process.env.JWT_SECRET || 'mcscafe_secret_key_2026';

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mcscafe',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'SEU_ACCESS_TOKEN_MERCADO_PAGO'
});

function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });

    jwt.verify(token, JWT_SECRET, (err, usuario) => {
        if (err) return res.status(403).json({ erro: 'Token inválido ou expirado.' });
        req.usuario = usuario;
        next();
    });
}

function verificarPermissao(cargosPermitidos = []) {
    return (req, res, next) => {
        if (!cargosPermitidos.includes(req.usuario.cargo_id)) {
            return res.status(403).json({ erro: 'Acesso não autorizado para seu nível de usuário.' });
        }
        next();
    };
}

app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

        const usuario = rows[0];
        const senhaValida = (senha === usuario.senha) || await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) return res.status(401).json({ erro: 'Senha incorreta.' });

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, cargo_id: usuario.cargo_id },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo_id: usuario.cargo_id,
                foto_perfil: usuario.foto_perfil
            }
        });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
});

app.post('/api/usuarios/foto', autenticarToken, upload.single('foto'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
        const caminhoFoto = `/uploads/${req.file.filename}`;

        await db.query('UPDATE usuarios SET foto_perfil = ? WHERE id = ?', [caminhoFoto, req.usuario.id]);
        return res.json({ mensagem: 'Foto atualizada com sucesso.', foto_perfil: caminhoFoto });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
});

app.get('/api/admin/pedidos', autenticarToken, verificarPermissao([2, 3]), async (req, res) => {
    try {
        const [pedidos] = await db.query(`
            SELECT p.id, p.valor_total, p.forma_pagamento, p.data_pedido, s.nome AS status, u.nome AS cliente
            FROM pedidos p
            JOIN status_pedido s ON p.status_id = s.id
            JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.data_pedido DESC
        `);
        return res.json(pedidos);
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
});

app.put('/api/admin/pedidos/:id/status', autenticarToken, verificarPermissao([2, 3]), async (req, res) => {
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
});

app.post('/api/pagamento/pix', autenticarToken, async (req, res) => {
    const { itens, observacoes } = req.body;
    try {
        let valorTotal = 0;
        const itensProcessados = [];

        for (const item of itens) {
            const [prod] = await db.query('SELECT preco FROM produtos WHERE id = ?', [item.produto_id]);
            if (prod.length > 0) {
                const preco = Number(prod[0].preco);
                valorTotal += preco * item.quantidade;
                itensProcessados.push({ ...item, preco_unitario: preco });
            }
        }

        const [novoPedido] = await db.query(
            'INSERT INTO pedidos (usuario_id, status_id, valor_total, forma_pagamento, observacoes) VALUES (?, 1, ?, "Pix", ?)',
            [req.usuario.id, valorTotal, observacoes || '']
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
                    title: `Pedido #${pedidoId} - MCS Café`,
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
});

app.post('/api/favoritos', autenticarToken, async (req, res) => {
    const { produto_id } = req.body;
    try {
        await db.query('INSERT IGNORE INTO favoritos (usuario_id, produto_id) VALUES (?, ?)', [req.usuario.id, produto_id]);
        return res.json({ mensagem: 'Produto adicionado aos favoritos.' });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
});

app.get('/api/favoritos', autenticarToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.* FROM produtos p
            JOIN favoritos f ON p.id = f.produto_id
            WHERE f.usuario_id = ?
        `, [req.usuario.id]);
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
});

app.delete('/api/favoritos/:produto_id', autenticarToken, async (req, res) => {
    try {
        await db.query('DELETE FROM favoritos WHERE usuario_id = ? AND produto_id = ?', [req.usuario.id, req.params.produto_id]);
        return res.json({ mensagem: 'Produto removido dos favoritos.' });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor MCS Café rodando na porta ${PORT}`);
});
