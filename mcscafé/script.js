let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

// Adiciona produto ao carrinho
function adicionarCarrinho(nome, preco) {
    const itemExistente = carrinho.find(item => item.nome === nome);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({
            nome: nome,
            preco: preco,
            quantidade: 1
        });
    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarCarrinho();
    alert(nome + " adicionado ao carrinho!");
}

// Atualiza contador do carrinho
function atualizarCarrinho() {
    const contador = document.getElementById("cart-count");
    if (contador) {
        const quantidadeTotal = carrinho.reduce(
            (total, item) => total + item.quantidade,
            0
        );
        contador.innerText = quantidadeTotal;
    }
}

// Remove item do carrinho pelo índice
function removerItem(indice) {
    if (carrinho[indice].quantidade > 1) {
        carrinho[indice].quantidade--;
    } else {
        carrinho.splice(indice, 1);
    }
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarCarrinho();
    exibirCarrinho();
}

// Exibe os itens do carrinho
function exibirCarrinho() {
    const lista = document.getElementById("lista-carrinho");
    const totalElemento = document.getElementById("total-carrinho");
    if (!lista) return;
    lista.innerHTML = "";

    let total = 0;

    carrinho.forEach((item, indice) => {
        total += item.preco * item.quantidade;
        lista.innerHTML += `
            <div class="item-carrinho">
                <span>${item.nome} (${item.quantidade}x)</span>
                <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                <button onclick="removerItem(${indice})">
                    X
                </button>
            </div>
        `;
    });
    if (totalElemento) {
        totalElemento.innerText = `Total: R$ ${total.toFixed(2)}`;
    }
}

// Limpa todo o carrinho
function limparCarrinho() {
    carrinho = [];
    localStorage.removeItem("carrinho");
    atualizarCarrinho();
    exibirCarrinho();
}

// Finalizar compra
function finalizarCompra() {

    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    alert("Compra finalizada com sucesso!");
    limparCarrinho();
}

// Executa quando a página carregar
document.addEventListener("DOMContentLoaded", () => {

    // Corrige carrinhos antigos que não possuem quantidade
    carrinho.forEach(item => {
        if (!item.quantidade) {
            item.quantidade = 1;
        }
    });

    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarCarrinho();
    exibirCarrinho();
});

//--------------carrosel de comentarios-------------------\\
const reviews = document.querySelectorAll('.review-slider .box');
const prevReview = document.querySelector('.prev-review');
const nextReview = document.querySelector('.next-review');

let currentReview = 0;

function showReview(index) {

    if (reviews.length === 0) return;
    reviews.forEach(review => {
        review.classList.remove('active');
    });
    reviews[index].classList.add('active');
}

if (nextReview) {
    nextReview.addEventListener('click', () => {
        currentReview++;
        if (currentReview >= reviews.length) {
            currentReview = 0;
        }

        showReview(currentReview);
    });
}

if (prevReview) {
    prevReview.addEventListener('click', () => {
        currentReview--;
        if (currentReview < 0) {
            currentReview = reviews.length - 1;
        }

        showReview(currentReview);
    });
}

// Troca automática a cada 3 segundos
if (reviews.length > 0) {
    showReview(currentReview);
    setInterval(() => {
        currentReview++;
        if (currentReview >= reviews.length) {
            currentReview = 0;
        }

        showReview(currentReview);
    }, 3000);
}

// ==================== CARREGAMENTO ====================

document.addEventListener("DOMContentLoaded", () => {
    atualizarCarrinho();
    exibirCarrinho();
});

// ==================== GRAFICO DE VENDAS ====================
const produtos = [
      "Café Coado",
      "Espresso",
      "Mocha",
      "Cappuccino",
      "Cold Brew",
      "Macchiato"
    ];

    const vendas = [20, 5, 2, 7, 1, 4];

    const paletaCafe = [
      '#d3ad7f',
      '#b88e5d',
      '#8c653d',
      '#5c3d21',
      '#3a2412',
      '#f4e3c5'
    ];

    Chart.defaults.color = '#ffffff';
    Chart.defaults.font.family = 'Outfit, sans-serif';

    new Chart(document.getElementById("graficoProdutos"), {

      type: "pie",
      data: {
        labels: produtos,
        datasets: [{
          label: "Quantidade Vendida",
          data: vendas,
          borderWidth: 1
        }]
      },

      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        }
      }
});


    new Chart(document.getElementById("graficoVendas"), {
      type: "doughnut",
      data: {
        labels: produtos,
        datasets: [{
          label: "quantidade de vendas",
          data: [vendas]
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: true,
        plungins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'mais vendidos',
            color: "#d3ad7f",
            font: {size: 16, weight: bold}
          }
        }
      }
});

    document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha })
                });

                const data = await response.json();

                if (data.success) {
                    alert('Login efetuado com sucesso!');
                    // Redirecione se desejar: window.location.href = 'dashboard.html';
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro ao conectar com o servidor.');
            }
        });
    }
});

    new Chart(document.getElementById("graficoVendas"), {
      type: "doughnut",
      data: {
        labels: produtos,
        datasets: [{
          label: "Quantidade de Vendas",
          data: vendas,
          backgroundColor: paletaCafe,
          borderColor: '#13131a',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15
            }
          },
          title: {
            display: true,
            text: 'Distribuição de Vendas',
            color: '#d3ad7f',
            font: {size: 16, weight: 'bold'}
          }
        }
      }
});

    const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve os arquivos estáticos (HTML, CSS, JS do frontend) na mesma pasta
app.use(express.static(__dirname));

// Configuração da conexão com o banco MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Altere se seu usuário do MySQL for diferente
    password: '',      // Coloque a sua senha do MySQL aqui
    database: 'mcscafe'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
    } else {
        console.log('Conectado ao banco de dados MySQL com sucesso!');
    }
});

// Rota de Login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    const query = 'SELECT * FROM usuarios WHERE email = ? AND senha = ?';
    db.query(query, [email, senha], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erro no servidor ao autenticar.' });
        }

        if (results.length > 0) {
            return res.json({ success: true, message: 'Login realizado com sucesso!' });
        } else {
            return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });
        }
    });
});

// Inicialização do servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor rodando em: http://localhost:3000/login.html');
});