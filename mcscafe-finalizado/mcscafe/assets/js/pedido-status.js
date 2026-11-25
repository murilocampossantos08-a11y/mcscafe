const pedidoId = Number(new URLSearchParams(location.search).get("pedido"));
const titulo = document.querySelector("[data-pedido-titulo]");
const situacao = document.querySelector("[data-pedido-situacao]");
const detalhes = document.querySelector("[data-pedido-detalhes]");
const moedaPedido = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const textosPagamento = {
  approved: "Pagamento aprovado.",
  pending: "Pagamento em análise.",
  in_process: "Pagamento em análise.",
  rejected: "Pagamento recusado. Você pode tentar novamente em Minha conta.",
  cancelled: "Pagamento cancelado.",
  pendente: "Pagamento na retirada ou ainda não confirmado.",
};

async function carregarPedido() {
  const resposta = await mcsApi.requisitar(`/pedidos/meus/${pedidoId}`);
  if (!resposta.ok) {
    titulo.textContent = "Pedido não encontrado";
    situacao.textContent = resposta.dados.erro || "Não foi possível carregar este pedido.";
    return false;
  }

  const pedido = resposta.dados.pedido;
  titulo.textContent = `Pedido #${pedido.id}`;
  situacao.textContent = `Status: ${pedido.status}. ${textosPagamento[pedido.pagamento_status] || ""}`;
  detalhes.replaceChildren();
  pedido.itens.forEach((item) => {
    const linha = document.createElement("p");
    linha.textContent = `${item.quantidade}× ${item.nome_produto || "Produto"} — ${moedaPedido.format(item.subtotal)}`;
    detalhes.append(linha);
  });
  const total = document.createElement("strong");
  total.textContent = `Total: ${moedaPedido.format(pedido.valor_total)}`;
  detalhes.append(total);
  return pedido.status_id !== 4 && pedido.status_id !== 5;
}

if (Number.isInteger(pedidoId) && pedidoId > 0 && mcsApi.exigirLogin()) {
  const atualizar = async () => {
    if (await carregarPedido()) window.setTimeout(atualizar, 15000);
  };
  atualizar();
} else if (!pedidoId) {
  titulo.textContent = "Pedido não informado";
  situacao.textContent = "Abra esta página a partir de Minha conta.";
}
