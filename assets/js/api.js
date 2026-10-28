const express = require('express');
const cors = require('cors');
const path = require('path');

const rotasAutenticacao = require('./routes/rotas-autenticacao');
const rotasUsuario = require('./routes/rotas-usuario');
const rotasAdmin = require('./routes/rotas-admin');
const rotasPagamento = require('./routes/rotas-pagamento');
const rotasFavoritos = require('./routes/rotas-favoritos');

const app = express();

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', rotasAutenticacao);
app.use('/api/usuarios', rotasUsuario);
app.use('/api/admin', rotasAdmin);
app.use('/api/pagamento', rotasPagamento);
app.use('/api/favoritos', rotasFavoritos);

module.exports = app;
