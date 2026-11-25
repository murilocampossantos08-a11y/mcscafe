const abas = [...document.querySelectorAll("[data-menu-tab]")];
const paineis = { cafe: document.getElementById("menu-cafe"), manha: document.getElementById("menu-manha") };

function selecionarAba(nome, focar = false) {
  abas.forEach((aba) => {
    const ativa = aba.dataset.menuTab === nome;
    aba.setAttribute("aria-selected", String(ativa));
    aba.tabIndex = ativa ? 0 : -1;
    if (ativa && focar) aba.focus();
  });
  Object.entries(paineis).forEach(([chave, painel]) => {
    if (painel) painel.hidden = chave !== nome;
  });
  if (history.replaceState) {
    history.replaceState(null, "", nome === "manha" ? "#cafe-da-manha" : location.pathname + location.search);
  }
}

abas.forEach((aba, indice) => {
  aba.addEventListener("click", () => selecionarAba(aba.dataset.menuTab));
  aba.addEventListener("keydown", (evento) => {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    const proxima = abas[(indice + (evento.key === "ArrowRight" ? 1 : abas.length - 1)) % abas.length];
    selecionarAba(proxima.dataset.menuTab, true);
  });
});

if (location.hash === "#cafe-da-manha") {
  selecionarAba("manha");
}

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function criarCartaoSemFoto(produto) {
  const cartao = document.createElement("article");
  cartao.className = "product-card product-card--sem-foto";
  const conteudo = document.createElement("div");
  conteudo.className = "product-card__content";
  const titulo = document.createElement("h2");
  titulo.textContent = produto.nome;
  conteudo.append(titulo);
  if (produto.descricao) {
    const descricao = document.createElement("p");
    descricao.className = "product-card__description";
    descricao.textContent = produto.descricao;
    conteudo.append(descricao);
  }
  const rodape = document.createElement("div");
  rodape.className = "product-card__footer";
  const preco = document.createElement("p");
  preco.className = "price";
  preco.textContent = formatoMoeda.format(produto.preco);
  const botao = document.createElement("button");
  botao.className = "button";
  botao.type = "button";
  botao.textContent = "Adicionar";
  botao.dataset.addToCart = "";
  botao.dataset.productId = String(produto.id);
  botao.dataset.productName = produto.nome;
  botao.dataset.productPrice = String(produto.preco);
  botao.addEventListener("click", () => adicionarAoCarrinho(produto.nome, Number(produto.preco), produto.id));
  rodape.append(preco, botao);
  conteudo.append(rodape);
  cartao.append(conteudo);
  return cartao;
}

async function sincronizarComBanco() {
  if (!window.mcsApi || !(await window.mcsApi.servidorDisponivel())) return;
  const resposta = await window.mcsApi.requisitar("/produtos");
  if (!resposta.ok || !Array.isArray(resposta.dados.produtos)) return;

  const porId = new Map(resposta.dados.produtos.map((produto) => [String(produto.id), produto]));

  document.querySelectorAll("[data-add-to-cart][data-product-id]").forEach((botao) => {
    const cartao = botao.closest(".product-card");
    const produto = porId.get(botao.dataset.productId);
    if (!cartao) return;
    if (!produto) {
      cartao.hidden = true;
      return;
    }
    if (Number(botao.dataset.productPrice) !== Number(produto.preco)) {
      botao.dataset.productPrice = String(produto.preco);
      const preco = cartao.querySelector(".price");
      if (preco) preco.textContent = formatoMoeda.format(produto.preco);
    }
  });

  const presentes = new Set([...document.querySelectorAll("[data-add-to-cart][data-product-id]")].map((b) => b.dataset.productId));
  resposta.dados.produtos
    .filter((produto) => produto.categoria_id === 4 && !presentes.has(String(produto.id)))
    .forEach((produto) => paineis.manha?.append(criarCartaoSemFoto(produto)));
}

sincronizarComBanco();
