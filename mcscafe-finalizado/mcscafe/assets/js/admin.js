const moedaAdmin = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataAdmin = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const ehAdmin = () => mcsApi.perfilAtual() === 3;

if (mcsApi.exigirLogin(2)) iniciarPainel();

function formatarMoeda(valor) {
  return moedaAdmin.format(valor);
}

function criar(tag, propriedades = {}, ...filhos) {
  const elemento = document.createElement(tag);
  Object.assign(elemento, propriedades);
  elemento.append(...filhos);
  return elemento;
}

function aviso(texto, erro = false) {
  const alvo = document.querySelector("[data-admin-status]");
  if (!alvo) return;
  alvo.textContent = texto;
  alvo.hidden = !texto;
}

function mensagemDialog(seletor, texto, erro = true) {
  const alvo = document.querySelector(seletor);
  if (!alvo) return;
  alvo.textContent = texto;
  alvo.classList.toggle("form-message--error", erro);
}

function abrirDialog(dialog) {
  dialog.showModal();
}

function falha(resposta, padrao) {
  return resposta.dados.erro || padrao;
}

let grafico = null;

function criarGraficoDeVendas(labels = [], data = []) {
  const canvas = document.querySelector("[data-sales-chart]");
  if (!canvas || typeof Chart === "undefined") return;
  if (grafico) grafico.destroy();

  grafico = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Unidades vendidas",
          data,
          backgroundColor: ["#d3ad7f", "#bd8e54", "#8c653d", "#6b4326", "#4a2e1a", "#e6c69a", "#a37a4a", "#7a5530"],
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { color: "#cbc7c1", precision: 0 }, grid: { color: "rgba(255,255,255,.09)" } },
        x: { ticks: { color: "#cbc7c1" }, grid: { display: false } },
      },
    },
  });
}

async function carregarMetricasDashboard() {
  const resposta = await mcsApi.requisitar("/admin/metricas");
  if (!resposta.ok) return;
  const dados = resposta.dados;
  document.querySelector("[data-metric-total]").textContent = String(dados.totalVendas);
  document.querySelector("[data-metric-faturamento]").textContent = formatarMoeda(dados.faturamentoTotal);
  document.querySelector("[data-metric-clientes]").textContent = String(dados.clientesAtendidos);
  document.querySelector("[data-metric-mais-vendido]").textContent = dados.produtoMaisVendido;
  criarGraficoDeVendas(dados.grafico.labels, dados.grafico.valores);
}

let categoriasCarregadas = false;
let produtoEmEdicao = null;
let produtosCache = [];

async function carregarCategorias() {
  const seletor = document.querySelector("[data-categorias]");
  if (!seletor || categoriasCarregadas) return;
  const resposta = await mcsApi.requisitar("/categorias");
  if (!resposta.ok) return;
  resposta.dados.categorias.forEach((categoria) => {
    seletor.append(criar("option", { value: String(categoria.id), textContent: categoria.nome }));
  });
  categoriasCarregadas = true;
}

async function carregarProdutos() {
  const tabela = document.querySelector("[data-produtos-lista]");
  if (!tabela) return;
  const resposta = await mcsApi.requisitar("/admin/produtos");
  if (!resposta.ok) {
    aviso(falha(resposta, "Não foi possível carregar os produtos."), true);
    return;
  }
  aviso("");
  produtosCache = resposta.dados.produtos;
  tabela.replaceChildren();

  produtosCache.forEach((produto) => {
    const imagem = produto.imagem_url
      ? criar("img", { src: produto.imagem_url, alt: "" })
      : criar("span", { textContent: "—" });
    const status = criar("span", {
      className: `status status--${produto.disponivel ? "active" : "draft"}`,
      textContent: produto.disponivel ? "Ativo" : "Inativo",
    });
    const acoes = criar("td", { className: "admin-actions-cell" });

    if (ehAdmin()) {
      const editar = criar("button", { className: "button button--secondary", type: "button", textContent: "Editar" });
      editar.addEventListener("click", () => abrirFormularioProduto(produto));
      const alternar = criar("button", {
        className: "button button--secondary",
        type: "button",
        textContent: produto.disponivel ? "Desativar" : "Ativar",
      });
      alternar.addEventListener("click", async () => {
        const r = await mcsApi.requisitar(`/admin/produtos/${produto.id}/disponibilidade`, {
          metodo: "PATCH",
          corpo: { disponivel: !produto.disponivel },
        });
        aviso(r.ok ? r.dados.mensagem : falha(r, "Erro ao alterar."), !r.ok);
        carregarProdutos();
      });
      const remover = criar("button", { className: "button button--danger", type: "button", textContent: "Excluir" });
      remover.addEventListener("click", async () => {
        if (!window.confirm(`Excluir "${produto.nome}"?`)) return;
        const r = await mcsApi.requisitar(`/admin/produtos/${produto.id}`, { metodo: "DELETE" });
        aviso(r.ok ? r.dados.mensagem : falha(r, "Erro ao excluir."), !r.ok);
        carregarProdutos();
      });
      acoes.append(editar, alternar, remover);
    }

    tabela.append(
      criar(
        "tr",
        {},
        criar("td", {}, imagem),
        criar("td", {}, criar("strong", { textContent: produto.nome })),
        criar("td", { textContent: produto.categoria }),
        criar("td", { textContent: formatarMoeda(produto.preco) }),
        criar("td", {}, status),
        acoes,
      ),
    );
  });
}

function abrirFormularioProduto(produto = null) {
  const dialog = document.querySelector("[data-produto-dialog]");
  const formulario = document.querySelector("[data-produto-form]");
  produtoEmEdicao = produto;
  formulario.reset();
  mensagemDialog("[data-produto-status]", "");
  document.querySelector("[data-produto-titulo]").textContent = produto ? "Editar produto" : "Novo produto";
  if (produto) {
    formulario.elements.nome.value = produto.nome;
    formulario.elements.categoria_id.value = String(produto.categoria_id);
    formulario.elements.preco.value = String(produto.preco);
    formulario.elements.descricao.value = produto.descricao || "";
    formulario.elements.imagem_url.value = produto.imagem_url || "";
    formulario.elements.disponivel.checked = Boolean(produto.disponivel);
  }
  abrirDialog(dialog);
}

async function salvarProduto(evento) {
  evento.preventDefault();
  const campos = evento.currentTarget.elements;
  const corpo = {
    nome: campos.nome.value.trim(),
    categoria_id: Number(campos.categoria_id.value),
    preco: campos.preco.value,
    descricao: campos.descricao.value.trim(),
    imagem_url: campos.imagem_url.value.trim(),
    disponivel: campos.disponivel.checked,
  };
  const resposta = produtoEmEdicao
    ? await mcsApi.requisitar(`/admin/produtos/${produtoEmEdicao.id}`, { metodo: "PUT", corpo })
    : await mcsApi.requisitar("/admin/produtos", { metodo: "POST", corpo });

  if (!resposta.ok) {
    mensagemDialog("[data-produto-status]", falha(resposta, "Não foi possível salvar."));
    return;
  }
  document.querySelector("[data-produto-dialog]").close();
  aviso(resposta.dados.mensagem);
  carregarProdutos();
}

let insumoEmEdicao = null;

async function carregarEstoque() {
  const tabela = document.querySelector("[data-estoque-lista]");
  if (!tabela) return;
  const resposta = await mcsApi.requisitar("/admin/estoque");
  if (!resposta.ok) {
    aviso(falha(resposta, "Não foi possível carregar o estoque."), true);
    return;
  }
  aviso("");
  tabela.replaceChildren();

  resposta.dados.insumos.forEach((insumo) => {
    const situacao = criar("span", {
      className: `status status--${insumo.abaixo_do_minimo ? "draft" : "active"}`,
      textContent: insumo.abaixo_do_minimo ? "Repor" : "Em dia",
    });
    const acoes = criar("td", { className: "admin-actions-cell" });
    const editar = criar("button", { className: "button button--secondary", type: "button", textContent: "Editar" });
    editar.addEventListener("click", () => abrirFormularioInsumo(insumo));
    acoes.append(editar);

    if (ehAdmin()) {
      const remover = criar("button", { className: "button button--danger", type: "button", textContent: "Excluir" });
      remover.addEventListener("click", async () => {
        if (!window.confirm(`Excluir "${insumo.nome_insumo}"?`)) return;
        const r = await mcsApi.requisitar(`/admin/estoque/${insumo.id}`, { metodo: "DELETE" });
        aviso(r.ok ? r.dados.mensagem : falha(r, "Erro ao excluir."), !r.ok);
        carregarEstoque();
      });
      acoes.append(remover);
    }

    tabela.append(
      criar(
        "tr",
        {},
        criar("td", {}, criar("strong", { textContent: insumo.nome_insumo })),
        criar("td", { textContent: `${insumo.quantidade_disponivel} ${insumo.unidade_medida}` }),
        criar("td", { textContent: `${insumo.quantidade_minima} ${insumo.unidade_medida}` }),
        criar("td", {}, situacao),
        acoes,
      ),
    );
  });
}

function abrirFormularioInsumo(insumo = null) {
  const dialog = document.querySelector("[data-insumo-dialog]");
  const formulario = document.querySelector("[data-insumo-form]");
  insumoEmEdicao = insumo;
  formulario.reset();
  mensagemDialog("[data-insumo-status]", "");
  document.querySelector("[data-insumo-titulo]").textContent = insumo ? "Editar insumo" : "Novo insumo";
  if (insumo) {
    formulario.elements.nome_insumo.value = insumo.nome_insumo;
    formulario.elements.quantidade_disponivel.value = String(insumo.quantidade_disponivel);
    formulario.elements.unidade_medida.value = insumo.unidade_medida;
    formulario.elements.quantidade_minima.value = String(insumo.quantidade_minima);
  }
  formulario.elements.nome_insumo.readOnly = false;
  abrirDialog(dialog);
}

async function salvarInsumo(evento) {
  evento.preventDefault();
  const campos = evento.currentTarget.elements;
  const corpo = {
    nome_insumo: campos.nome_insumo.value.trim(),
    quantidade_disponivel: campos.quantidade_disponivel.value,
    unidade_medida: campos.unidade_medida.value.trim(),
    quantidade_minima: campos.quantidade_minima.value,
  };
  const resposta = insumoEmEdicao
    ? await mcsApi.requisitar(`/admin/estoque/${insumoEmEdicao.id}`, { metodo: "PUT", corpo })
    : await mcsApi.requisitar("/admin/estoque", { metodo: "POST", corpo });

  if (!resposta.ok) {
    mensagemDialog("[data-insumo-status]", falha(resposta, "Não foi possível salvar."));
    return;
  }
  document.querySelector("[data-insumo-dialog]").close();
  aviso(resposta.dados.mensagem);
  carregarEstoque();
}

let statusCarregados = false;

async function carregarPedidos() {
  const lista = document.querySelector("[data-pedidos-lista]");
  if (!lista) return;

  const filtro = document.querySelector("[data-pedidos-filtro]");
  const periodo = document.querySelector("[data-pedidos-periodo]");

  if (!statusCarregados) {
    const status = await mcsApi.requisitar("/admin/status");
    if (status.ok) {
      status.dados.status.forEach((item) => filtro.append(criar("option", { value: String(item.id), textContent: item.nome })));
      lista.dataset.status = JSON.stringify(status.dados.status);
      statusCarregados = true;
    }
  }

  const parametros = new URLSearchParams();
  if (filtro.value) parametros.set("status", filtro.value);
  if (periodo.value) parametros.set("data", periodo.value);

  const resposta = await mcsApi.requisitar(`/admin/pedidos?${parametros}`);
  if (!resposta.ok) {
    aviso(falha(resposta, "Não foi possível carregar os pedidos."), true);
    return;
  }

  const todosStatus = JSON.parse(lista.dataset.status || "[]");
  aviso(resposta.dados.pedidos.length === 0 ? "Nenhum pedido encontrado." : "");
  lista.replaceChildren();

  resposta.dados.pedidos.forEach((pedido) => {
    const itens = criar("ul");
    pedido.itens.forEach((item) => {
      itens.append(criar("li", { textContent: `${item.quantidade}× ${item.nome_produto || "Produto"} — ${formatarMoeda(item.subtotal)}` }));
    });

    const seletor = criar("select", { ariaLabel: `Status do pedido ${pedido.id}` });
    todosStatus.forEach((status) => {
      seletor.append(criar("option", { value: String(status.id), textContent: status.nome, selected: status.id === pedido.status_id }));
    });
    seletor.addEventListener("change", async () => {
      const r = await mcsApi.requisitar(`/admin/pedidos/${pedido.id}/status`, {
        metodo: "PUT",
        corpo: { status_id: Number(seletor.value) },
      });
      aviso(r.ok ? r.dados.mensagem : falha(r, "Erro ao atualizar."), !r.ok);
      carregarPedidos();
    });

    const detalhes = [`${dataAdmin.format(new Date(pedido.data_pedido))}`, pedido.forma_pagamento, `Pagamento: ${pedido.pagamento_status}`];
    lista.append(
      criar(
        "article",
        { className: "admin-order" },
        criar(
          "header",
          {},
          criar("h2", { textContent: `Pedido #${pedido.id} — ${pedido.cliente}` }),
          criar("strong", { textContent: formatarMoeda(pedido.valor_total) }),
        ),
        criar("p", { textContent: detalhes.join(" · ") + (pedido.telefone ? ` · ${pedido.telefone}` : "") }),
        itens,
        pedido.observacoes ? criar("p", { textContent: `Observações: ${pedido.observacoes}` }) : criar("span"),
        seletor,
      ),
    );
  });
}

async function carregarFuncionarios() {
  const lista = document.querySelector("[data-funcionarios-lista]");
  if (!lista) return;
  const resposta = await mcsApi.requisitar("/admin/funcionarios");
  if (!resposta.ok) {
    aviso(falha(resposta, "Não foi possível carregar a equipe."), true);
    return;
  }
  aviso(resposta.dados.funcionarios.length === 0 ? "Nenhum funcionário cadastrado." : "");
  lista.replaceChildren();

  resposta.dados.funcionarios.forEach((funcionario) => {
    const iniciais = funcionario.nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join("");
    const avatar = funcionario.foto_perfil
      ? criar("img", { src: funcionario.foto_perfil, alt: `Foto de ${funcionario.nome}` })
      : criar("span", { className: "employee__initials", textContent: iniciais, ariaHidden: "true" });
    const botao = criar("button", { className: "button button--secondary", type: "button", textContent: "Ver vendas" });
    botao.addEventListener("click", () => mostrarFuncionario(funcionario.id));
    const cargo = funcionario.ativo ? funcionario.cargo : `${funcionario.cargo} (inativo)`;

    lista.append(
      criar(
        "article",
        { className: "employee" },
        avatar,
        criar("div", {}, criar("h2", { textContent: funcionario.nome }), criar("p", { textContent: cargo })),
        botao,
      ),
    );
  });
}

async function mostrarFuncionario(id) {
  const painel = document.querySelector("[data-employee-detail]");
  const resposta = await mcsApi.requisitar(`/admin/funcionarios/${id}`);
  if (!resposta.ok) {
    aviso(falha(resposta, "Não foi possível carregar o resumo."), true);
    return;
  }
  const dados = resposta.dados;
  painel.querySelector("[data-employee-name]").textContent = dados.nome;
  painel.querySelector("[data-employee-sales]").textContent = String(dados.vendas);
  painel.querySelector("[data-employee-revenue]").textContent = formatarMoeda(dados.faturamento);
  painel.querySelector("[data-employee-ticket]").textContent = formatarMoeda(dados.faturamento / (dados.vendas || 1));
  painel.querySelector("[data-employee-product]").textContent = dados.produto;
  painel.hidden = false;
  painel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function salvarFuncionario(evento) {
  evento.preventDefault();
  const campos = evento.currentTarget.elements;
  const resposta = await mcsApi.requisitar("/admin/funcionarios", {
    metodo: "POST",
    corpo: {
      nome: campos.nome.value.trim(),
      email: campos.email.value.trim(),
      telefone: campos.telefone.value.trim(),
      senha: campos.senha.value,
      cargo_id: Number(campos.cargo_id.value),
    },
  });
  if (!resposta.ok) {
    mensagemDialog("[data-funcionario-status]", falha(resposta, "Não foi possível salvar."));
    return;
  }
  document.querySelector("[data-funcionario-dialog]").close();
  aviso(resposta.dados.mensagem);
  carregarFuncionarios();
}

async function carregarAvaliacoes() {
  const tabela = document.querySelector("[data-avaliacoes-lista]");
  if (!tabela) return;
  const resposta = await mcsApi.requisitar("/admin/avaliacoes");
  if (!resposta.ok) {
    aviso(falha(resposta, "Não foi possível carregar as avaliações."), true);
    return;
  }
  aviso(resposta.dados.avaliacoes.length === 0 ? "Nenhuma avaliação recebida." : "");
  tabela.replaceChildren();

  resposta.dados.avaliacoes.forEach((avaliacao) => {
    const acoes = criar("td", { className: "admin-actions-cell" });
    if (ehAdmin()) {
      const moderar = criar("button", {
        className: "button button--secondary",
        type: "button",
        textContent: avaliacao.aprovada ? "Ocultar" : "Aprovar",
      });
      moderar.addEventListener("click", async () => {
        const r = await mcsApi.requisitar(`/admin/avaliacoes/${avaliacao.id}`, { metodo: "PUT", corpo: { aprovada: !avaliacao.aprovada } });
        aviso(r.ok ? r.dados.mensagem : falha(r, "Erro ao moderar."), !r.ok);
        carregarAvaliacoes();
      });
      const remover = criar("button", { className: "button button--danger", type: "button", textContent: "Excluir" });
      remover.addEventListener("click", async () => {
        if (!window.confirm("Excluir esta avaliação?")) return;
        await mcsApi.requisitar(`/admin/avaliacoes/${avaliacao.id}`, { metodo: "DELETE" });
        carregarAvaliacoes();
      });
      acoes.append(moderar, remover);
    }
    tabela.append(
      criar(
        "tr",
        {},
        criar("td", { textContent: `${avaliacao.nome} (${avaliacao.email})` }),
        criar("td", { textContent: `${avaliacao.nota}/5` }),
        criar("td", { textContent: avaliacao.comentario }),
        criar("td", {}, criar("span", { className: `status status--${avaliacao.aprovada ? "active" : "draft"}`, textContent: avaliacao.aprovada ? "Publicada" : "Pendente" })),
        acoes,
      ),
    );
  });
}

function iniciarPainel() {
  document.querySelector("[data-sair]")?.addEventListener("click", () => {
    mcsApi.sair();
    window.location.assign("/login.html");
  });

  if (!ehAdmin()) {
    document.querySelectorAll("[data-somente-admin]").forEach((elemento) => {
      elemento.hidden = true;
    });
  }

  document.querySelectorAll("[data-fechar-dialog]").forEach((botao) => {
    botao.addEventListener("click", () => botao.closest("dialog").close());
  });

  document.querySelector("[data-action-novo-produto]")?.addEventListener("click", () => abrirFormularioProduto());
  document.querySelector("[data-produto-form]")?.addEventListener("submit", salvarProduto);
  document.querySelector("[data-action-novo-insumo]")?.addEventListener("click", () => abrirFormularioInsumo());
  document.querySelector("[data-insumo-form]")?.addEventListener("submit", salvarInsumo);
  document.querySelector("[data-action-novo-funcionario]")?.addEventListener("click", () => {
    const formulario = document.querySelector("[data-funcionario-form]");
    formulario.reset();
    mensagemDialog("[data-funcionario-status]", "");
    abrirDialog(document.querySelector("[data-funcionario-dialog]"));
  });
  document.querySelector("[data-funcionario-form]")?.addEventListener("submit", salvarFuncionario);
  document.querySelector("[data-pedidos-filtro]")?.addEventListener("change", carregarPedidos);
  document.querySelector("[data-pedidos-periodo]")?.addEventListener("change", carregarPedidos);

  carregarCategorias().then(carregarProdutos);
  carregarEstoque();
  carregarFuncionarios();
  carregarAvaliacoes();
  carregarMetricasDashboard();
  carregarPedidos();

  if (document.querySelector("[data-pedidos-lista]") || document.querySelector("[data-sales-chart]")) {
    window.setInterval(() => {
      carregarPedidos();
      carregarMetricasDashboard();
    }, 30000);
  }
}
