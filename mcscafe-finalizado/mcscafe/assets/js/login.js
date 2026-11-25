const formularioLogin = document.querySelector("[data-demo-login]");
const parametros = new URLSearchParams(location.search);
const cargoPorPerfil = { Administrador: 3, Funcionário: 2, Cliente: 1 };

function destinoSeguro(cargoId, perfil) {
  const voltar = parametros.get("voltar");
  const valido = voltar && voltar.startsWith("/") && !voltar.startsWith("//");
  if (valido && (!voltar.startsWith("/admin") || cargoId >= 2)) return voltar;
  return perfil === "Cliente" || cargoId < 2 ? "/paginas/conta.html" : "/admin/index.html";
}

formularioLogin?.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  const status = formulario.querySelector("[data-login-status]");
  const email = formulario.elements.email.value.trim();
  const senha = formulario.elements.senha.value;
  const perfil = formulario.elements.perfil?.value || "Cliente";

  if (!email || !senha) {
    status.textContent = "Preencha e-mail e senha.";
    return;
  }

  status.textContent = "Autenticando…";
  const resposta = await mcsApi.requisitar("/auth/login", { metodo: "POST", corpo: { email, senha } });

  if (!resposta.ok) {
    status.textContent =
      resposta.status === 0 || resposta.status === 404 || resposta.status === 503
        ? "Servidor indisponível no momento. Tente novamente mais tarde."
        : resposta.dados.erro || "Erro ao realizar login.";
    return;
  }

  const usuario = resposta.dados.usuario;
  const exigido = cargoPorPerfil[perfil] || 1;
  if (exigido > 1 && usuario.cargo_id < exigido) {
    status.textContent = `Este usuário não tem acesso como ${perfil}.`;
    return;
  }

  mcsApi.salvarSessao(resposta.dados.token, usuario);
  status.textContent = "Entrando…";
  window.location.assign(destinoSeguro(usuario.cargo_id, perfil));
});
