const CARRINHO_CHAVE = "mcscafe:carrinho";
const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function lerCarrinho() {
  try {
    const valorSalvo = JSON.parse(localStorage.getItem(CARRINHO_CHAVE) ?? "[]");

    if (!Array.isArray(valorSalvo)) {
      return [];
    }

    return valorSalvo.filter(
      (item) =>
        typeof item?.nome === "string" &&
        Number.isFinite(Number(item.preco)) &&
        Number.isInteger(item.quantidade) &&
        item.quantidade > 0,
    );
  } catch {
    return [];
  }
}

let carrinho = lerCarrinho();

function salvarCarrinho() {
  localStorage.setItem(CARRINHO_CHAVE, JSON.stringify(carrinho));
  atualizarIndicadores();
  renderizarCarrinho();
}

function quantidadeTotal() {
  return carrinho.reduce((total, item) => total + item.quantidade, 0);
}

function totalCarrinho() {
  return carrinho.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0,
  );
}

function avisar(mensagem) {
  const anterior = document.querySelector(".site-message");
  anterior?.remove();

  const aviso = document.createElement("div");
  aviso.className = "site-message";
  aviso.setAttribute("role", "status");
  aviso.textContent = mensagem;
  document.body.append(aviso);

  window.setTimeout(() => aviso.remove(), 3200);
}

function atualizarIndicadores() {
  const quantidade = String(quantidadeTotal());
  document.querySelectorAll("[data-cart-count]").forEach((contador) => {
    contador.textContent = quantidade;
  });
}

function adicionarAoCarrinho(nome, preco) {
  const itemExistente = carrinho.find((item) => item.nome === nome);

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({ nome, preco, quantidade: 1 });
  }

  salvarCarrinho();
  avisar(`${nome} foi adicionado ao carrinho.`);
}

function alterarQuantidade(indice, variacao) {
  const item = carrinho[indice];
  if (!item) {
    return;
  }

  item.quantidade += variacao;
  if (item.quantidade <= 0) {
    carrinho.splice(indice, 1);
  }

  salvarCarrinho();
}

function removerDoCarrinho(indice) {
  const item = carrinho[indice];
  if (!item) {
    return;
  }

  carrinho.splice(indice, 1);
  salvarCarrinho();
  avisar(`${item.nome} foi removido do carrinho.`);
}

function criarBotao(texto, acao, indice, rotulo) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = texto;
  botao.dataset.cartAction = acao;
  botao.dataset.cartIndex = String(indice);
  botao.setAttribute("aria-label", rotulo);
  return botao;
}

function renderizarCarrinho() {
  const lista = document.querySelector("[data-cart-list]");
  const total = document.querySelector("[data-cart-total]");

  if (!lista || !total) {
    return;
  }

  lista.replaceChildren();
  total.textContent = moeda.format(totalCarrinho());

  if (carrinho.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "cart-empty";
    vazio.textContent =
      "Seu carrinho está vazio. Escolha um café no cardápio para começar.";
    lista.append(vazio);
    return;
  }

  carrinho.forEach((item, indice) => {
    const linha = document.createElement("article");
    linha.className = "cart-item";

    const descricao = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "cart-item__name";
    nome.textContent = item.nome;
    const precoUnitario = document.createElement("p");
    precoUnitario.className = "cart-item__unit-price";
    precoUnitario.textContent = `${moeda.format(item.preco)} por unidade`;
    descricao.append(nome, precoUnitario);

    const controle = document.createElement("div");
    controle.className = "quantity-control";
    controle.append(
      criarBotao(
        "−",
        "decrease",
        indice,
        `Diminuir quantidade de ${item.nome}`,
      ),
      Object.assign(document.createElement("output"), {
        textContent: String(item.quantidade),
      }),
      criarBotao(
        "+",
        "increase",
        indice,
        `Aumentar quantidade de ${item.nome}`,
      ),
    );

    const valor = document.createElement("strong");
    valor.className = "cart-item__total";
    valor.textContent = moeda.format(item.preco * item.quantidade);

    const remover = criarBotao(
      "Remover",
      "remove",
      indice,
      `Remover ${item.nome} do carrinho`,
    );
    remover.className = "cart-item__remove";

    linha.append(descricao, controle, valor, remover);
    lista.append(linha);
  });
}

function inicializarBotoesDeProduto() {
  document.querySelectorAll("[data-add-to-cart]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const nome = botao.dataset.productName;
      const preco = Number(botao.dataset.productPrice);

      if (!nome || !Number.isFinite(preco)) {
        avisar("Não foi possível adicionar este produto.");
        return;
      }

      adicionarAoCarrinho(nome, preco);
    });
  });
}

function inicializarCarrinho() {
  document
    .querySelector("[data-cart-list]")
    ?.addEventListener("click", (evento) => {
      const botao = evento.target.closest("[data-cart-action]");
      if (!botao) {
        return;
      }

      const indice = Number(botao.dataset.cartIndex);
      if (botao.dataset.cartAction === "increase") {
        alterarQuantidade(indice, 1);
      }

      if (botao.dataset.cartAction === "decrease") {
        alterarQuantidade(indice, -1);
      }

      if (botao.dataset.cartAction === "remove") {
        removerDoCarrinho(indice);
      }
    });

  document.querySelector("[data-clear-cart]")?.addEventListener("click", () => {
    carrinho = [];
    salvarCarrinho();
    avisar("Carrinho esvaziado.");
  });

  document
    .querySelector("[data-finish-order]")
    ?.addEventListener("click", () => {
      if (carrinho.length === 0) {
        avisar("Adicione um produto antes de finalizar.");
        return;
      }

      carrinho = [];
      salvarCarrinho();
      avisar("Pedido demonstrativo concluído. Nenhuma cobrança foi realizada.");
    });
}

inicializarBotoesDeProduto();
inicializarCarrinho();
atualizarIndicadores();
renderizarCarrinho();
