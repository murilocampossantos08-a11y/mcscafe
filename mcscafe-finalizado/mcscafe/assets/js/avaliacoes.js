let cartoesDeAvaliacao = [...document.querySelectorAll("[data-review-card]")];
let indiceAtual = 0;

function exibirAvaliacao(indice) {
  if (cartoesDeAvaliacao.length === 0) {
    return;
  }

  indiceAtual =
    (indice + cartoesDeAvaliacao.length) % cartoesDeAvaliacao.length;
  cartoesDeAvaliacao.forEach((cartao, indiceDoCartao) => {
    cartao.hidden = indiceDoCartao !== indiceAtual;
  });
}

function criarCartaoDeAvaliacao(avaliacao) {
  const cartao = document.createElement("article");
  cartao.className = "review-card";
  cartao.dataset.reviewCard = "";
  cartao.hidden = true;

  const texto = document.createElement("blockquote");
  texto.textContent = `“${avaliacao.comentario}”`;

  const avatar = document.createElement("img");
  avatar.className = "review-card__avatar";
  avatar.src = avaliacao.foto_perfil || "../assets/imagens/logo.png";
  avatar.alt = `Foto de ${avaliacao.nome}`;

  const nome = document.createElement("h2");
  nome.textContent = avaliacao.nome;

  const estrelas = document.createElement("p");
  estrelas.className = "stars";
  estrelas.setAttribute("aria-label", `${avaliacao.nota} de 5 estrelas`);
  estrelas.textContent = "★".repeat(avaliacao.nota) + "☆".repeat(5 - avaliacao.nota);

  cartao.append(texto, avatar, nome, estrelas);
  return cartao;
}

async function carregarAvaliacoesDoBanco() {
  if (!window.mcsApi || !(await window.mcsApi.servidorDisponivel())) return;
  const resposta = await window.mcsApi.requisitar("/avaliacoes");
  if (!resposta.ok || !Array.isArray(resposta.dados.avaliacoes)) return;

  const controles = document.querySelector(".review-controls");
  resposta.dados.avaliacoes.forEach((avaliacao) => {
    controles.before(criarCartaoDeAvaliacao(avaliacao));
  });
  cartoesDeAvaliacao = [...document.querySelectorAll("[data-review-card]")];
  exibirAvaliacao(indiceAtual);
}

document.querySelector("[data-review-next]")?.addEventListener("click", () => {
  exibirAvaliacao(indiceAtual + 1);
});

document
  .querySelector("[data-review-previous]")
  ?.addEventListener("click", () => {
    exibirAvaliacao(indiceAtual - 1);
  });

exibirAvaliacao(0);
carregarAvaliacoesDoBanco();
