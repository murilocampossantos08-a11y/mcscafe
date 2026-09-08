document
  .querySelector("[data-demo-login]")
  ?.addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const status = form.querySelector("[data-login-status]");
    const email = form.elements.email.value.trim();
    const senha = form.elements.senha.value;

    if (!email || !senha) {
      status.textContent = "Preencha e-mail e senha para abrir a demonstração.";
      return;
    }

    status.textContent = "Abrindo a área administrativa demonstrativa…";
    window.setTimeout(() => {
      window.location.assign("/admin");
    }, 450);
  });
