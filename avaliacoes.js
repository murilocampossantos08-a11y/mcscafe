const cartoesDeAvaliacao = [...document.querySelectorAll("[data-review-card]")];
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

document.querySelector("[data-review-next]")?.addEventListener("click", () => {
  exibirAvaliacao(indiceAtual + 1);
});

document
  .querySelector("[data-review-previous]")
  ?.addEventListener("click", () => {
    exibirAvaliacao(indiceAtual - 1);
  });

exibirAvaliacao(0);
