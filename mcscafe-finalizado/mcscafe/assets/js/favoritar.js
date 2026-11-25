const botaoFavoritar = document.querySelector("[data-favoritar]");

botaoFavoritar?.addEventListener("click", async () => {
  if (!mcsApi.token()) {
    avisar("Entre na sua conta para favoritar.");
    window.setTimeout(() => {
      window.location.assign("/login.html?voltar=" + encodeURIComponent(location.pathname));
    }, 900);
    return;
  }

  const resposta = await mcsApi.requisitar("/favoritos", {
    metodo: "POST",
    corpo: { produto_id: Number(botaoFavoritar.dataset.favoritar) },
  });
  avisar(resposta.ok ? "Adicionado aos favoritos." : resposta.dados.erro || "Não foi possível favoritar.");
});
