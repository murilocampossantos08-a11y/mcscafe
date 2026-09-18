const db = require('../config/banco-de-dados');

exports.adicionarFavorito = async (req, res) => {
    const { produto_id } = req.body;
    try {
        await db.query('INSERT IGNORE INTO favoritos (usuario_id, produto_id) VALUES (?, ?)', [req.usuario.id, produto_id]);
        return res.json({ mensagem: 'Produto adicionado aos favoritos.' });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
};

exports.listarFavoritos = async (req, res) => {
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
};

exports.removerFavorito = async (req, res) => {
    try {
        await db.query('DELETE FROM favoritos WHERE usuario_id = ? AND produto_id = ?', [req.usuario.id, req.params.produto_id]);
        return res.json({ mensagem: 'Produto removido dos favoritos.' });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
};
