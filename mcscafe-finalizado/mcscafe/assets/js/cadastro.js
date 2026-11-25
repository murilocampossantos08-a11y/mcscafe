const formularioCadastro = document.querySelector("[data-cadastro]");

formularioCadastro?.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  const status = formulario.querySelector("[data-cadastro-status]");
  const campos = formulario.elements;

  if (campos.senha.value !== campos.confirmar.value) {
    status.textContent = "As senhas não conferem.";
    return;
  }

  status.textContent = "Criando sua conta…";
  const resposta = await mcsApi.requisitar("/auth/registrar", {
    metodo: "POST",
    corpo: {
      nome: campos.nome.value.trim(),
      email: campos.email.value.trim(),
      telefone: campos.telefone.value.trim(),
      senha: campos.senha.value,
    },
  });

  if (!resposta.ok) {
    status.textContent =
      resposta.status === 0 || resposta.status === 404 || resposta.status === 503
        ? "Servidor indisponível no momento. Tente novamente mais tarde."
        : resposta.dados.erro || "Não foi possível criar a conta.";
    return;
  }

  mcsApi.salvarSessao(resposta.dados.token, resposta.dados.usuario);
  const voltar = new URLSearchParams(location.search).get("voltar");
  const valido = voltar && voltar.startsWith("/") && !voltar.startsWith("//") && !voltar.startsWith("/admin");
  window.location.assign(valido ? voltar : "/paginas/conta.html");
});
