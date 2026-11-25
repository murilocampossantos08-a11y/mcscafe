const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { autenticar, exigirCargo, CARGOS } = require('../middlewares/autenticacao');
const db = require('../config/banco');
const auth = require('../controladores/auth');
const usuarios = require('../controladores/usuarios');
const produtos = require('../controladores/produtos');
const pedidos = require('../controladores/pedidos');
const pagamento = require('../controladores/pagamento');
const favoritos = require('../controladores/favoritos');
const avaliacoes = require('../controladores/avaliacoes');
const admin = require('../controladores/admin');

const limiteAcesso = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos.' },
});

const equipe = [CARGOS.ATENDENTE, CARGOS.ADMIN];
const roteador = express.Router();

roteador.get('/saude', async (req, res) => {
  try {
    await db.testarConexao();
    res.json({ ok: true, banco: true });
  } catch {
    res.status(503).json({ ok: false, banco: false });
  }
});

roteador.get('/config', pagamento.configuracao);

roteador.post('/auth/registrar', limiteAcesso, auth.registrar);
roteador.post('/auth/login', limiteAcesso, auth.login);
roteador.post('/auth/recuperar/solicitar', limiteAcesso, auth.solicitarRecuperacao);
roteador.post('/auth/recuperar/redefinir', limiteAcesso, auth.redefinirSenha);
roteador.get('/auth/eu', autenticar, auth.eu);

roteador.get('/categorias', produtos.listarCategorias);
roteador.get('/produtos', produtos.listarPublico);
roteador.get('/avaliacoes', avaliacoes.listarPublicas);

roteador.get('/usuarios/perfil', autenticar, usuarios.obterPerfil);
roteador.put('/usuarios/perfil', autenticar, usuarios.atualizarPerfil);
roteador.put('/usuarios/senha', autenticar, usuarios.alterarSenha);
roteador.post('/usuarios/foto', autenticar, usuarios.atualizarFoto);
roteador.delete('/usuarios/foto', autenticar, usuarios.removerFoto);

roteador.get('/favoritos', autenticar, favoritos.listar);
roteador.post('/favoritos', autenticar, favoritos.adicionar);
roteador.delete('/favoritos/:produtoId', autenticar, favoritos.remover);

roteador.get('/minha-avaliacao', autenticar, avaliacoes.obterMinha);
roteador.put('/minha-avaliacao', autenticar, avaliacoes.salvarMinha);

roteador.post('/pedidos', autenticar, pedidos.criar);
roteador.get('/pedidos/meus', autenticar, pedidos.listarMeus);
roteador.get('/pedidos/meus/:id', autenticar, pedidos.obterMeu);
roteador.put('/pedidos/meus/:id/cancelar', autenticar, pedidos.cancelarMeu);

roteador.post('/pagamento/checkout/:pedidoId', autenticar, pagamento.iniciarCheckout);
roteador.post('/pagamento/webhook', pagamento.webhook);

const painel = express.Router();
painel.use(autenticar, exigirCargo(...equipe));
painel.get('/metricas', admin.metricas);
painel.get('/status', pedidos.listarStatus);
painel.get('/pedidos', pedidos.listarAdmin);
painel.put('/pedidos/:id/status', pedidos.atualizarStatus);
painel.get('/produtos', produtos.listarAdmin);
painel.get('/estoque', admin.listarEstoque);
painel.put('/estoque/:id', admin.atualizarInsumo);
painel.get('/funcionarios', admin.listarFuncionarios);
painel.get('/funcionarios/:id', admin.detalharFuncionario);
painel.get('/avaliacoes', avaliacoes.listarAdmin);

const somenteAdmin = exigirCargo(CARGOS.ADMIN);
painel.post('/produtos', somenteAdmin, produtos.criar);
painel.put('/produtos/:id', somenteAdmin, produtos.atualizar);
painel.patch('/produtos/:id/disponibilidade', somenteAdmin, produtos.alterarDisponibilidade);
painel.delete('/produtos/:id', somenteAdmin, produtos.remover);
painel.post('/estoque', somenteAdmin, admin.criarInsumo);
painel.delete('/estoque/:id', somenteAdmin, admin.removerInsumo);
painel.post('/funcionarios', somenteAdmin, admin.criarFuncionario);
painel.put('/funcionarios/:id', somenteAdmin, admin.atualizarFuncionario);
painel.put('/avaliacoes/:id', somenteAdmin, avaliacoes.moderar);
painel.delete('/avaliacoes/:id', somenteAdmin, avaliacoes.removerAdmin);

roteador.use('/admin', painel);

module.exports = roteador;
