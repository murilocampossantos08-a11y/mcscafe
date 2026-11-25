if (mcsApi.exigirLogin()) iniciarConta();

function criar(tag, propriedades = {}, ...filhos) {
  const elemento = document.createElement(tag);
  Object.assign(elemento, propriedades);
  elemento.append(...filhos);
  return elemento;
}

const moedaConta = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataConta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function mensagem(seletor, texto, erro = false) {
  const alvo = document.querySelector(seletor);
  if (!alvo) return;
  alvo.textContent = texto;
  alvo.classList.toggle("form-message--error", erro);
}

function classeStatus(nome) {
  if (nome === "Concluído") return "order-status order-status--concluido";
  if (nome === "Cancelado") return "order-status order-status--cancelado";
  return "order-status";
}

function reduzirImagem(arquivo) {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onerror = () => rejeitar(new Error("Não foi possível ler a imagem."));
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onerror = () => rejeitar(new Error("Arquivo de imagem inválido."));
      imagem.onload = () => {
        const lado = 256;
        const canvas = document.createElement("canvas");
        canvas.width = lado;
        canvas.height = lado;
        const corte = Math.min(imagem.width, imagem.height);
        canvas
          .getContext("2d")
          .drawImage(imagem, (imagem.width - corte) / 2, (imagem.height - corte) / 2, corte, corte, 0, 0, lado, lado);
        resolver(canvas.toDataURL("image/jpeg", 0.85));
      };
      imagem.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

async function carregarPerfil() {
  const resposta = await mcsApi.requisitar("/usuarios/perfil");
  if (!resposta.ok) {
    mensagem("[data-perfil-status]", resposta.dados.erro || "Não foi possível carregar seus dados.", true);
    return;
  }
  const usuario = resposta.dados.usuario;
  document.querySelector("[data-conta-nome]").textContent = usuario.nome.split(" ")[0];
  document.querySelector("[data-conta-email]").textContent = `${usuario.email} · ${usuario.cargo}`;
  const formulario = document.querySelector("[data-form-perfil]");
  formulario.elements.nome.value = usuario.nome;
  formulario.elements.telefone.value = usuario.telefone || "";
  if (usuario.foto_perfil) document.querySelector("[data-conta-foto]").src = usuario.foto_perfil;
}

async function carregarPedidos() {
  const lista = document.querySelector("[data-pedidos-lista]");
  const [resposta, config] = await Promise.all([mcsApi.requisitar("/pedidos/meus"), mcsApi.requisitar("/config")]);
  lista.replaceChildren();

  if (!resposta.ok) {
    lista.append(criar("p", { textContent: resposta.dados.erro || "Não foi possível carregar os pedidos." }));
    return;
  }
  if (resposta.dados.pedidos.length === 0) {
    lista.append(criar("p", { textContent: "Você ainda não fez pedidos." }));
    return;
  }

  const pagamentoOnline = config.ok && config.dados.pagamentoOnline;

  resposta.dados.pedidos.forEach((pedido) => {
    const itens = criar("ul");
    pedido.itens.forEach((item) => {
      itens.append(criar("li", { textContent: `${item.quantidade}× ${item.nome_produto || "Produto"} — ${moedaConta.format(item.subtotal)}` }));
    });

    const acoes = criar("div", { className: "button-group" });
    const pendente = pedido.status_id === 1 && pedido.pagamento_status !== "approved";

    if (pendente && pagamentoOnline) {
      const pagar = criar("button", { className: "button", type: "button", textContent: "Pagar online" });
      pagar.addEventListener("click", async () => {
        pagar.disabled = true;
        const checkout = await mcsApi.requisitar(`/pagamento/checkout/${pedido.id}`, { metodo: "POST" });
        pagar.disabled = false;
        if (checkout.ok && checkout.dados.checkout_url) {
          window.location.assign(checkout.dados.checkout_url);
        } else {
          avisar(checkout.dados.erro || "Não foi possível abrir o pagamento.");
        }
      });
      acoes.append(pagar);
    }

    if (pendente) {
      const cancelar = criar("button", { className: "button button--danger", type: "button", textContent: "Cancelar pedido" });
      cancelar.addEventListener("click", async () => {
        const cancelamento = await mcsApi.requisitar(`/pedidos/meus/${pedido.id}/cancelar`, { metodo: "PUT" });
        avisar(cancelamento.dados.mensagem || cancelamento.dados.erro || "Não foi possível cancelar.");
        carregarPedidos();
      });
      acoes.append(cancelar);
    }

    lista.append(
      criar(
        "article",
        { className: "order-card" },
        criar(
          "header",
          {},
          criar("strong", { textContent: `Pedido #${pedido.id}` }),
          criar("span", { className: classeStatus(pedido.status), textContent: pedido.status }),
        ),
        criar("p", { textContent: `${dataConta.format(new Date(pedido.data_pedido))} · ${pedido.forma_pagamento}` }),
        itens,
        criar("strong", { textContent: `Total: ${moedaConta.format(pedido.valor_total)}` }),
        acoes,
      ),
    );
  });
}

async function carregarFavoritos() {
  const lista = document.querySelector("[data-favoritos-lista]");
  const resposta = await mcsApi.requisitar("/favoritos");
  lista.replaceChildren();

  if (!resposta.ok) {
    lista.append(criar("p", { textContent: resposta.dados.erro || "Não foi possível carregar os favoritos." }));
    return;
  }
  if (resposta.dados.favoritos.length === 0) {
    lista.append(criar("p", { textContent: "Nenhum favorito ainda. Use o botão Favoritar na página de um café." }));
    return;
  }

  resposta.dados.favoritos.forEach((produto) => {
    const adicionar = criar("button", { className: "button", type: "button", textContent: "Adicionar" });
    adicionar.disabled = !produto.disponivel;
    adicionar.addEventListener("click", () => adicionarAoCarrinho(produto.nome, Number(produto.preco), produto.id));

    const remover = criar("button", { className: "button button--danger", type: "button", textContent: "Remover" });
    remover.addEventListener("click", async () => {
      await mcsApi.requisitar(`/favoritos/${produto.id}`, { metodo: "DELETE" });
      carregarFavoritos();
    });

    lista.append(
      criar(
        "article",
        { className: "favorite-item" },
        criar("div", {}, criar("strong", { textContent: produto.nome }), criar("p", { textContent: moedaConta.format(produto.preco) })),
        criar("div", { className: "button-group" }, adicionar, remover),
      ),
    );
  });
}

async function carregarAvaliacao() {
  const resposta = await mcsApi.requisitar("/minha-avaliacao");
  const avaliacao = resposta.ok ? resposta.dados.avaliacao : null;
  if (!avaliacao) return;
  const formulario = document.querySelector("[data-form-avaliacao]");
  formulario.elements.nota.value = String(avaliacao.nota);
  formulario.elements.comentario.value = avaliacao.comentario;
  mensagem("[data-avaliacao-status]", avaliacao.aprovada ? "Sua avaliação está publicada no site." : "Sua avaliação aguarda aprovação.");
}

function iniciarConta() {
  carregarPerfil();
  carregarPedidos();
  carregarFavoritos();
  carregarAvaliacao();

  document.querySelector("[data-sair]").addEventListener("click", () => {
    mcsApi.sair();
    window.location.assign("/");
  });

  document.querySelector("[data-foto-arquivo]").addEventListener("change", async (evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    try {
      const imagem = await reduzirImagem(arquivo);
      const resposta = await mcsApi.requisitar("/usuarios/foto", { metodo: "POST", corpo: { imagem } });
      if (!resposta.ok) throw new Error(resposta.dados.erro || "Não foi possível salvar a foto.");
      document.querySelector("[data-conta-foto]").src = imagem;
      mensagem("[data-perfil-status]", "Foto atualizada.");
    } catch (erro) {
      mensagem("[data-perfil-status]", erro.message, true);
    }
    evento.target.value = "";
  });

  document.querySelector("[data-foto-remover]").addEventListener("click", async () => {
    const resposta = await mcsApi.requisitar("/usuarios/foto", { metodo: "DELETE" });
    if (resposta.ok) {
      document.querySelector("[data-conta-foto]").src = "../assets/imagens/logo.png";
      mensagem("[data-perfil-status]", "Foto removida.");
    }
  });

  document.querySelector("[data-form-perfil]").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const campos = evento.currentTarget.elements;
    const resposta = await mcsApi.requisitar("/usuarios/perfil", {
      metodo: "PUT",
      corpo: { nome: campos.nome.value.trim(), telefone: campos.telefone.value.trim() },
    });
    mensagem("[data-perfil-status]", resposta.dados.mensagem || resposta.dados.erro || "Erro ao salvar.", !resposta.ok);
    if (resposta.ok) carregarPerfil();
  });

  document.querySelector("[data-form-senha]").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const resposta = await mcsApi.requisitar("/usuarios/senha", {
      metodo: "PUT",
      corpo: { senhaAtual: formulario.elements.senhaAtual.value, novaSenha: formulario.elements.novaSenha.value },
    });
    mensagem("[data-senha-status]", resposta.dados.mensagem || resposta.dados.erro || "Erro ao alterar.", !resposta.ok);
    if (resposta.ok) formulario.reset();
  });

  document.querySelector("[data-form-avaliacao]").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const campos = evento.currentTarget.elements;
    const resposta = await mcsApi.requisitar("/minha-avaliacao", {
      metodo: "PUT",
      corpo: { nota: Number(campos.nota.value), comentario: campos.comentario.value.trim() },
    });
    mensagem("[data-avaliacao-status]", resposta.dados.mensagem || resposta.dados.erro || "Erro ao enviar.", !resposta.ok);
  });
}
