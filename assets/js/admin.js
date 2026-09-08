function criarGraficoDeVendas() {
  const canvas = document.querySelector("[data-sales-chart]");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: [
        "Café coado",
        "Espresso",
        "Mocha",
        "Cappuccino",
        "Cold Brew",
        "Macchiato",
      ],
      datasets: [
        {
          label: "Unidades vendidas",
          data: [20, 5, 2, 7, 1, 4],
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

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

const dadosDeFuncionarios = {
  murilo: {
    nome: "Murilo Campos Santos",
    vendas: 18,
    faturamento: 245.5,
    produto: "Café coado",
  },
  ana: {
    nome: "Ana Paula Silva",
    vendas: 12,
    faturamento: 158,
    produto: "Cold Brew",
  },
  carlos: {
    nome: "Carlos Eduardo",
    vendas: 25,
    faturamento: 320,
    produto: "Espresso",
  },
};

document.querySelectorAll("[data-employee]").forEach((botao) => {
  botao.addEventListener("click", () => {
    const funcionario = dadosDeFuncionarios[botao.dataset.employee];
    const painel = document.querySelector("[data-employee-detail]");

    if (!funcionario || !painel) {
      return;
    }

    painel.querySelector("[data-employee-name]").textContent = funcionario.nome;
    painel.querySelector("[data-employee-sales]").textContent = String(
      funcionario.vendas,
    );
    painel.querySelector("[data-employee-revenue]").textContent = formatarMoeda(
      funcionario.faturamento,
    );
    painel.querySelector("[data-employee-ticket]").textContent = formatarMoeda(
      funcionario.faturamento / funcionario.vendas,
    );
    painel.querySelector("[data-employee-product]").textContent =
      funcionario.produto;
    painel.hidden = false;
    painel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});

document.querySelectorAll("[data-demo-action]").forEach((botao) => {
  botao.addEventListener("click", () => {
    window.alert(
      "Esta ação depende de um backend e está fora do escopo da demonstração estática.",
    );
  });
});

criarGraficoDeVendas();
