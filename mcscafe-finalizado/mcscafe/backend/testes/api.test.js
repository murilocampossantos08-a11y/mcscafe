const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste';

const app = require('../src/app');
const db = require('../src/config/banco');

const sufixo = Date.now();
const emailCliente = `cliente${sufixo}@teste.com`;
const emailAdmin = `admin${sufixo}@teste.com`;
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

let servidor;
let base;
let bancoOk = false;
const estado = {};

async function chamar(metodo, caminho, corpo, token) {
  const resposta = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    dados = null;
  }
  return { status: resposta.status, dados };
}

test.before(async () => {
  try {
    await db.testarConexao();
    bancoOk = true;
  } catch {
    bancoOk = false;
    return;
  }
  servidor = app.listen(0);
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  const hash = await bcrypt.hash('senhaAdmin123', 10);
  await db.query('INSERT INTO usuarios (nome, email, senha, cargo_id) VALUES (?, ?, ?, 3)', ['Admin Teste', emailAdmin, hash]);
});

test.after(async () => {
  if (servidor) servidor.close();
  if (bancoOk) {
    await db.query('DELETE FROM pedidos WHERE usuario_id IN (SELECT id FROM usuarios WHERE email IN (?, ?))', [emailCliente, emailAdmin]);
    await db.query('DELETE FROM usuarios WHERE email IN (?, ?)', [emailCliente, emailAdmin]);
    await db.query("DELETE FROM produtos WHERE nome = 'Produto de teste'");
    await db.query("DELETE FROM estoque_insumos WHERE nome_insumo = 'Insumo de teste'");
  }
  await db.end();
});

function pular(t) {
  if (!bancoOk) {
    t.skip('Banco indisponível');
    return true;
  }
  return false;
}

test('saúde e configuração', async (t) => {
  if (pular(t)) return;
  const saude = await chamar('GET', '/saude');
  assert.equal(saude.status, 200);
  const config = await chamar('GET', '/config');
  assert.equal(config.status, 200);
  assert.equal(typeof config.dados.pagamentoOnline, 'boolean');
});

test('cadastro, login e validações', async (t) => {
  if (pular(t)) return;
  const invalido = await chamar('POST', '/auth/registrar', { nome: 'A', email: 'x', senha: '123' });
  assert.equal(invalido.status, 400);

  const criado = await chamar('POST', '/auth/registrar', { nome: 'Cliente Teste', email: emailCliente, senha: 'senha12345', telefone: '(11) 98349-4854' });
  assert.equal(criado.status, 201);
  assert.ok(criado.dados.token);
  assert.equal(criado.dados.usuario.cargo_id, 1);
  estado.token = criado.dados.token;

  const duplicado = await chamar('POST', '/auth/registrar', { nome: 'Cliente Teste', email: emailCliente, senha: 'senha12345' });
  assert.equal(duplicado.status, 409);

  const errado = await chamar('POST', '/auth/login', { email: emailCliente, senha: 'incorreta123' });
  assert.equal(errado.status, 401);

  const certo = await chamar('POST', '/auth/login', { email: emailCliente, senha: 'senha12345' });
  assert.equal(certo.status, 200);
  estado.token = certo.dados.token;

  const eu = await chamar('GET', '/auth/eu', null, estado.token);
  assert.equal(eu.dados.usuario.email, emailCliente);

  const semToken = await chamar('GET', '/auth/eu');
  assert.equal(semToken.status, 401);
});

test('cardápio público', async (t) => {
  if (pular(t)) return;
  const lista = await chamar('GET', '/produtos');
  assert.equal(lista.status, 200);
  assert.ok(lista.dados.produtos.length >= 12);
  const manha = await chamar('GET', '/produtos?categoria=4');
  assert.ok(manha.dados.produtos.every((p) => p.categoria === 'Café da Manhã'));
  assert.ok(manha.dados.produtos.some((p) => p.nome === 'Pão de queijo'));
});

test('pedido com preços calculados no servidor', async (t) => {
  if (pular(t)) return;
  const semLogin = await chamar('POST', '/pedidos', { itens: [{ produto_id: 1, quantidade: 1 }] });
  assert.equal(semLogin.status, 401);

  const vazio = await chamar('POST', '/pedidos', { itens: [] }, estado.token);
  assert.equal(vazio.status, 400);

  const inexistente = await chamar('POST', '/pedidos', { itens: [{ produto_id: 9999, quantidade: 1 }] }, estado.token);
  assert.equal(inexistente.status, 400);

  const pedido = await chamar(
    'POST',
    '/pedidos',
    { itens: [{ produto_id: 1, quantidade: 2, preco: 0.01 }, { nome: 'Pão de queijo', quantidade: 1 }, { produto_id: 1, quantidade: 1 }], pagamento: 'online' },
    estado.token,
  );
  assert.equal(pedido.status, 201);
  assert.equal(pedido.dados.pedido.valor_total, 13);
  assert.equal(pedido.dados.pedido.forma_pagamento, 'Na retirada');
  estado.pedidoId = pedido.dados.pedido.id;

  const meus = await chamar('GET', '/pedidos/meus', null, estado.token);
  assert.equal(meus.dados.pedidos[0].id, estado.pedidoId);
  assert.equal(meus.dados.pedidos[0].itens.length, 2);

  const pagarSemMp = await chamar('POST', `/pagamento/checkout/${estado.pedidoId}`, null, estado.token);
  assert.equal(pagarSemMp.status, 503);
});

test('cliente não acessa o painel', async (t) => {
  if (pular(t)) return;
  const metricas = await chamar('GET', '/admin/metricas', null, estado.token);
  assert.equal(metricas.status, 403);
  const semToken = await chamar('GET', '/admin/pedidos');
  assert.equal(semToken.status, 401);
});

test('painel administrativo', async (t) => {
  if (pular(t)) return;
  const login = await chamar('POST', '/auth/login', { email: emailAdmin, senha: 'senhaAdmin123' });
  assert.equal(login.status, 200);
  const token = login.dados.token;

  const pedidos = await chamar('GET', '/admin/pedidos?data=hoje', null, token);
  assert.ok(pedidos.dados.pedidos.some((p) => p.id === estado.pedidoId));

  const preparo = await chamar('PUT', `/admin/pedidos/${estado.pedidoId}/status`, { status_id: 2 }, token);
  assert.equal(preparo.status, 200);
  const concluido = await chamar('PUT', `/admin/pedidos/${estado.pedidoId}/status`, { status_id: 4 }, token);
  assert.equal(concluido.status, 200);
  const invalido = await chamar('PUT', `/admin/pedidos/${estado.pedidoId}/status`, { status_id: 99 }, token);
  assert.equal(invalido.status, 400);

  const metricas = await chamar('GET', '/admin/metricas', null, token);
  assert.equal(metricas.status, 200);
  assert.ok(metricas.dados.totalVendas >= 1);
  assert.ok(metricas.dados.faturamentoTotal >= 13);
  assert.ok(metricas.dados.grafico.labels.length >= 1);

  const funcionarios = await chamar('GET', '/admin/funcionarios', null, token);
  const admin = funcionarios.dados.funcionarios.find((f) => f.email === emailAdmin);
  assert.ok(admin);
  const detalhe = await chamar('GET', `/admin/funcionarios/${admin.id}`, null, token);
  assert.equal(detalhe.status, 200);
  assert.equal(detalhe.dados.vendas, 1);
  assert.equal(detalhe.dados.faturamento, 13);

  const novo = await chamar(
    'POST',
    '/admin/produtos',
    { nome: 'Produto de teste', categoria_id: 4, preco: '7,50', descricao: 'Teste', imagem_url: '' },
    token,
  );
  assert.equal(novo.status, 201);
  const id = novo.dados.id;
  const editado = await chamar('PUT', `/admin/produtos/${id}`, { nome: 'Produto de teste', categoria_id: 4, preco: 8, disponivel: true }, token);
  assert.equal(editado.status, 200);
  const imagemRuim = await chamar('PUT', `/admin/produtos/${id}`, { nome: 'Produto de teste', categoria_id: 4, preco: 8, imagem_url: 'javascript:alert(1)' }, token);
  assert.equal(imagemRuim.status, 400);
  const desativado = await chamar('PATCH', `/admin/produtos/${id}/disponibilidade`, { disponivel: false }, token);
  assert.equal(desativado.status, 200);
  const publico = await chamar('GET', '/produtos');
  assert.ok(!publico.dados.produtos.some((p) => p.id === id));
  const removido = await chamar('DELETE', `/admin/produtos/${id}`, null, token);
  assert.equal(removido.status, 200);

  const insumo = await chamar('POST', '/admin/estoque', { nome_insumo: 'Insumo de teste', quantidade_disponivel: 1, unidade_medida: 'kg', quantidade_minima: 2 }, token);
  assert.equal(insumo.status, 201);
  const estoque = await chamar('GET', '/admin/estoque', null, token);
  const criado = estoque.dados.insumos.find((i) => i.nome_insumo === 'Insumo de teste');
  assert.equal(criado.abaixo_do_minimo, true);
  const atualizado = await chamar('PUT', `/admin/estoque/${insumo.dados.id}`, { nome_insumo: 'Insumo de teste', quantidade_disponivel: 5, unidade_medida: 'kg', quantidade_minima: 2 }, token);
  assert.equal(atualizado.status, 200);
  const apagado = await chamar('DELETE', `/admin/estoque/${insumo.dados.id}`, null, token);
  assert.equal(apagado.status, 200);

  estado.tokenAdmin = token;
});

test('cancelamento de pedido pendente', async (t) => {
  if (pular(t)) return;
  const pedido = await chamar('POST', '/pedidos', { itens: [{ produto_id: 2, quantidade: 1 }] }, estado.token);
  const id = pedido.dados.pedido.id;
  const cancelado = await chamar('PUT', `/pedidos/meus/${id}/cancelar`, null, estado.token);
  assert.equal(cancelado.status, 200);
  const outraVez = await chamar('PUT', `/pedidos/meus/${id}/cancelar`, null, estado.token);
  assert.equal(outraVez.status, 409);
  const concluido = await chamar('PUT', `/pedidos/meus/${estado.pedidoId}/cancelar`, null, estado.token);
  assert.equal(concluido.status, 409);
});

test('perfil, foto, senha, favoritos e avaliação', async (t) => {
  if (pular(t)) return;
  const perfil = await chamar('PUT', '/usuarios/perfil', { nome: 'Cliente Novo Nome', telefone: '11999998888' }, estado.token);
  assert.equal(perfil.status, 200);

  const fotoRuim = await chamar('POST', '/usuarios/foto', { imagem: 'data:image/png;base64,AAAAAAAAAAAAAAAAAAAA' }, estado.token);
  assert.equal(fotoRuim.status, 400);
  const foto = await chamar('POST', '/usuarios/foto', { imagem: PNG }, estado.token);
  assert.equal(foto.status, 200);
  const dados = await chamar('GET', '/usuarios/perfil', null, estado.token);
  assert.equal(dados.dados.usuario.foto_perfil, PNG);
  assert.equal(dados.dados.usuario.nome, 'Cliente Novo Nome');

  const senhaErrada = await chamar('PUT', '/usuarios/senha', { senhaAtual: 'x', novaSenha: 'novaSenha123' }, estado.token);
  assert.equal(senhaErrada.status, 401);

  const fav = await chamar('POST', '/favoritos', { produto_id: 3 }, estado.token);
  assert.equal(fav.status, 201);
  await chamar('POST', '/favoritos', { produto_id: 3 }, estado.token);
  const lista = await chamar('GET', '/favoritos', null, estado.token);
  assert.equal(lista.dados.favoritos.length, 1);
  await chamar('DELETE', '/favoritos/3', null, estado.token);
  const vazia = await chamar('GET', '/favoritos', null, estado.token);
  assert.equal(vazia.dados.favoritos.length, 0);

  const nota = await chamar('PUT', '/minha-avaliacao', { nota: 5, comentario: 'Café excelente!' }, estado.token);
  assert.equal(nota.status, 201);
  const antes = await chamar('GET', '/avaliacoes');
  assert.ok(!antes.dados.avaliacoes.some((a) => a.comentario === 'Café excelente!'));

  const todas = await chamar('GET', '/admin/avaliacoes', null, estado.tokenAdmin);
  const minha = todas.dados.avaliacoes.find((a) => a.email === emailCliente);
  const aprovada = await chamar('PUT', `/admin/avaliacoes/${minha.id}`, { aprovada: true }, estado.tokenAdmin);
  assert.equal(aprovada.status, 200);
  const depois = await chamar('GET', '/avaliacoes');
  assert.ok(depois.dados.avaliacoes.some((a) => a.comentario === 'Café excelente!'));
});

test('recuperação de senha', async (t) => {
  if (pular(t)) return;
  const desconhecido = await chamar('POST', '/auth/recuperar/solicitar', { email: `ninguem${sufixo}@teste.com` });
  assert.equal(desconhecido.status, 200);
  assert.equal(desconhecido.dados.codigo_desenvolvimento, undefined);

  const pedido = await chamar('POST', '/auth/recuperar/solicitar', { email: emailCliente });
  assert.equal(pedido.status, 200);
  const codigo = pedido.dados.codigo_desenvolvimento;
  assert.match(codigo, /^\d{6}$/);

  const errado = await chamar('POST', '/auth/recuperar/redefinir', { email: emailCliente, codigo: '000000', novaSenha: 'outraSenha123' });
  assert.equal(errado.status, 400);

  const certo = await chamar('POST', '/auth/recuperar/redefinir', { email: emailCliente, codigo, novaSenha: 'outraSenha123' });
  assert.equal(certo.status, 200);

  const reuso = await chamar('POST', '/auth/recuperar/redefinir', { email: emailCliente, codigo, novaSenha: 'maisUmaSenha123' });
  assert.equal(reuso.status, 400);

  const login = await chamar('POST', '/auth/login', { email: emailCliente, senha: 'outraSenha123' });
  assert.equal(login.status, 200);
  const antiga = await chamar('POST', '/auth/login', { email: emailCliente, senha: 'senha12345' });
  assert.equal(antiga.status, 401);
});

test('rota inexistente da API', async (t) => {
  if (pular(t)) return;
  const resposta = await chamar('GET', '/nao-existe');
  assert.equal(resposta.status, 404);
});
