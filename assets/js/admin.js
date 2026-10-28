function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

async function carregarMetricasDashboard() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/metricas", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return;
    const dados = await response.json();

    const total = document.querySelector("[data-metric-total]");
    const faturamento = document.querySelector("[data-metric-faturamento]");
    const clientes = document.querySelector("[data-metric-clientes]");
    const maisVendido = document.querySelector("[data-metric-mais-vendido]");

    if (total) total.textContent = dados.totalVendas;
    if (faturamento) faturamento.textContent = formatarMoeda(dados.faturamentoTotal);
    if (clientes) clientes.textContent = dados.clientesAtendidos;
    if (maisVendido) maisVendido.textContent = dados.produtoMaisVendido;

    if (dados.grafico) {
      criarGraficoDeVendas(dados.grafico.labels, dados.grafico.valores);
    }
  } catch (err) {
    console.error(err);
  }
}

function criarGraficoDeVendas(labels = [], data = []) {
  const canvas = document.querySelector("[data-sales-chart]");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Unidades vendidas",
          data: data,
          backgroundColor: [
            "#d3ad7f",
            "#bd8e54",
            "#8c653d",
            "#6b4326",
            "#4a2e1a",
            "#e6c69a",
          ],
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#cbc7c1", precision: 0 },
          grid: { color: "rgba(255,255,255,.09)" },
        },
        x: {
          ticks: { color: "#cbc7c1" },
          grid: { display: false },
        },
      },
    },
  });
}

async function carregarProdutos() {
  const tabela = document.querySelector("[data-produtos-lista]");
  if (!tabela) return;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/produtos", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return;
    const produtos = await response.json();

    tabela.innerHTML = produtos.map(prod => `
      <tr>
        <td><img src="${prod.imagem || '../assets/imagens/menu-1.png'}" alt="" /></td>
        <td><strong>${prod.nome}</strong></td>
        <td>${prod.categoria}</td>
        <td>${formatarMoeda(prod.preco)}</td>
        <td><span class="status status--${prod.status === 'Ativo' ? 'active' : 'draft'}">${prod.status}</span></td>
        <td>
          <button class="button button--secondary" type="button" data-id="${prod.id}">Editar</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    console.error(err);
  }
}

async function carregarDetalhesFuncionario(funcionarioId) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/admin/funcionarios/${funcionarioId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

document.querySelectorAll("[data-employee]").forEach((botao) => {
  botao.addEventListener("click", async () => {
    const funcionarioId = botao.dataset.employee;
    const painel = document.querySelector("[data-employee-detail]");

    if (!funcionarioId || !painel) {
      return;
    }

    const funcionario = await carregarDetalhesFuncionario(funcionarioId);
    if (!funcionario) return;

    painel.querySelector("[data-employee-name]").textContent = funcionario.nome;
    painel.querySelector("[data-employee-sales]").textContent = String(funcionario.vendas);
    painel.querySelector("[data-employee-revenue]").textContent = formatarMoeda(funcionario.faturamento);
    painel.querySelector("[data-employee-ticket]").textContent = formatarMoeda(funcionario.faturamento / (funcionario.vendas || 1));
    painel.querySelector("[data-employee-product]").textContent = funcionario.produto;
    painel.hidden = false;
    painel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  carregarMetricasDashboard();
  carregarProdutos();
});
