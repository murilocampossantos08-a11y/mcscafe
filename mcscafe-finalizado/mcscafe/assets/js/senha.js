const formularioSolicitar = document.querySelector("[data-recuperar-solicitar]");
const formularioRedefinir = document.querySelector("[data-recuperar-redefinir]");

function falhaDeServidor(resposta) {
  return resposta.status === 0 || resposta.status === 404 || resposta.status === 503;
}

formularioSolicitar?.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const status = formularioSolicitar.querySelector("[data-recuperar-status]");
  const email = formularioSolicitar.elements.email.value.trim();

  status.textContent = "Enviando…";
  const resposta = await mcsApi.requisitar("/auth/recuperar/solicitar", { metodo: "POST", corpo: { email } });

  if (!resposta.ok) {
    status.textContent = falhaDeServidor(resposta)
      ? "Servidor indisponível no momento. Tente novamente mais tarde."
      : resposta.dados.erro || "Não foi possível enviar o código.";
    return;
  }

  status.textContent = resposta.dados.codigo_desenvolvimento
    ? `${resposta.dados.mensagem} Código de desenvolvimento: ${resposta.dados.codigo_desenvolvimento}`
    : resposta.dados.mensagem;
  formularioRedefinir.elements.email.value = email;
  formularioRedefinir.hidden = false;
  formularioRedefinir.elements.codigo.focus();
});

formularioRedefinir?.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const status = formularioRedefinir.querySelector("[data-redefinir-status]");
  const campos = formularioRedefinir.elements;

  if (campos.novaSenha.value !== campos.confirmar.value) {
    status.textContent = "As senhas não conferem.";
    return;
  }

  status.textContent = "Salvando…";
  const resposta = await mcsApi.requisitar("/auth/recuperar/redefinir", {
    metodo: "POST",
    corpo: { email: campos.email.value, codigo: campos.codigo.value.trim(), novaSenha: campos.novaSenha.value },
  });

  if (!resposta.ok) {
    status.textContent = falhaDeServidor(resposta)
      ? "Servidor indisponível no momento. Tente novamente mais tarde."
      : resposta.dados.erro || "Não foi possível alterar a senha.";
    return;
  }

  status.textContent = resposta.dados.mensagem;
  formularioRedefinir.querySelector("[data-voltar-login]").hidden = false;
});
