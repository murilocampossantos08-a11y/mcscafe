document
  .querySelector("[data-demo-login]")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const status = form.querySelector("[data-login-status]");
    const email = form.elements.email.value.trim();
    const senha = form.elements.senha.value;

    if (!email || !senha) {
      status.textContent = "Preencha e-mail e senha para abrir a demonstração.";
      return;
    }
    status.textContent = "Autenticando…";
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });
      const data = await response.json();
      if (!response.ok) {
        status.textContent = data.erro || "Erro ao realizar login.";
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      status.textContent = "Abrindo a área administrativa…";
      window.location.assign("/admin");
    } catch (err) {
      status.textContent = "Erro ao conectar ao servidor.";
    }
  });

  const express = require('express');
  const router = express.Router();
  const authController = require('../controllers/authController');

  router.post('/login', authController.login);

  module.exports = router;

  const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mcscafe_secret_key_2026';

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

module.exports = { autenticarToken, verificarPermissao, JWT_SECRET };

const db = require('../config/banco-de-dados');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET } = require('../middlewares/autenticacao');

exports.registrar = async (req, res) => {
    const { nome, email, senha, telefone } = req.body;
    try {
        const [existente] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existente.length > 0) return res.status(400).json({ erro: 'E-mail já cadastrado.' });

        const senhaHash = await bcrypt.hash(senha, 10);
        const [resultado] = await db.query(
            'INSERT INTO usuarios (nome, email, senha, telefone, cargo_id) VALUES (?, ?, ?, ?, 1)',
            [nome, email, senhaHash, telefone || null]
        );

        return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso.', usuario_id: resultado.insertId });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
};

exports.login = async (req, res) => {
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
                telefone: usuario.telefone,
                cargo_id: usuario.cargo_id,
                foto_perfil: usuario.foto_perfil
            }
        });
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
};