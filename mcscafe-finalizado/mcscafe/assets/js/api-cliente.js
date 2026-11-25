(function () {
  const CHAVE_TOKEN = "mcscafe:token";
  const CHAVE_USUARIO = "mcscafe:usuario";
  const base = ((window.MCS_CONFIG && window.MCS_CONFIG.apiBase) || "").replace(/\/$/, "");

  function lerStorage(chave) {
    try {
      return localStorage.getItem(chave);
    } catch {
      return null;
    }
  }

  function token() {
    return lerStorage(CHAVE_TOKEN);
  }

  function usuario() {
    try {
      return JSON.parse(lerStorage(CHAVE_USUARIO) || "null");
    } catch {
      return null;
    }
  }

  function salvarSessao(novoToken, novoUsuario) {
    try {
      localStorage.setItem(CHAVE_TOKEN, novoToken);
      localStorage.setItem(CHAVE_USUARIO, JSON.stringify(novoUsuario));
    } catch {}
  }

  function sair() {
    try {
      localStorage.removeItem(CHAVE_TOKEN);
      localStorage.removeItem(CHAVE_USUARIO);
    } catch {}
  }

  async function requisitar(caminho, opcoes = {}) {
    const cabecalhos = { Accept: "application/json" };
    const dadosToken = token();
    if (dadosToken) cabecalhos.Authorization = `Bearer ${dadosToken}`;
    if (opcoes.corpo !== undefined) cabecalhos["Content-Type"] = "application/json";

    try {
      const resposta = await fetch(`${base}/api${caminho}`, {
        method: opcoes.metodo || "GET",
        headers: cabecalhos,
        body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
      });
      let dados = null;
      try {
        dados = await resposta.json();
      } catch {
        dados = null;
      }
      if (resposta.status === 401 && dadosToken) sair();
      return { ok: resposta.ok && dados !== null, status: resposta.status, dados: dados || {} };
    } catch {
      return { ok: false, status: 0, dados: { erro: "Não foi possível conectar ao servidor." } };
    }
  }

  let disponibilidade = null;
  function servidorDisponivel() {
    if (!disponibilidade) {
      disponibilidade = requisitar("/saude").then((r) => r.ok && r.dados.banco === true);
    }
    return disponibilidade;
  }

  function perfilAtual() {
    const dados = usuario();
    return dados ? dados.cargo_id : null;
  }

  function destinoPorCargo(cargoId) {
    return cargoId >= 2 ? "/admin/index.html" : "/paginas/conta.html";
  }

  function exigirLogin(cargoMinimo = 1) {
    const dados = usuario();
    if (!token() || !dados || dados.cargo_id < cargoMinimo) {
      const destino = encodeURIComponent(location.pathname);
      location.replace(`/login.html?voltar=${destino}`);
      return false;
    }
    return true;
  }

  function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  window.mcsApi = {
    requisitar,
    token,
    usuario,
    salvarSessao,
    sair,
    servidorDisponivel,
    perfilAtual,
    destinoPorCargo,
    exigirLogin,
    escapar,
  };
})();
