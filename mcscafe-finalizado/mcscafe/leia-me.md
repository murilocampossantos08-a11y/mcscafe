# MCS Café — leia-me (tudo que foi alterado)

Nenhum comentário foi colocado no código. Tudo está explicado aqui.

## Atenção urgente: segurança

O arquivo antigo `assets/js/pagamento.js` tinha um **token real do Mercado Pago escrito no código** e estava público no GitHub e no site (`/assets/js/pagamento.js`). Esse arquivo foi removido, mas o token continua no histórico do GitHub. **Entre no painel do Mercado Pago, revogue o token e gere outro**, usando-o só pela variável `MP_ACCESS_TOKEN`. Também havia uma chave JWT padrão escrita no código; agora ela é obrigatória por variável de ambiente.

## O que NÃO foi mexido (suas regras)

- Organização/layout das páginas: mantido. Só entraram a área de abas no cardápio e os links/botões novos descritos abaixo.
- Fonte: mantida.
- Sem emojis nas bebidas/cardápio.
- Imagens: nenhuma criada, removida ou alterada. As pastas `assets/img`, `assets/imagens`, `assets/icon` e `assets/icones` continuam iguais.

## 1. Menu de café da manhã

- Arquivos: `paginas/cardapio.html`, `assets/js/cardapio.js` e estilos no final de `assets/css/base.css`.
- Acima da lista, fora do navbar, há dois botões: **Café** (primeiro, abre por padrão) e **Café da manhã**.
- Café da manhã: Pão de queijo, Bolo de cenoura, Bolo de fubá, Pão na chapa, Misto quente e Croissant. **Sem fotos**: os cartões ficam sem imagem para você adicionar depois.
- **Os preços do café da manhã (R$ 4,00 a R$ 9,00) são valores de exemplo que eu escolhi. Ajuste-os** no HTML (`data-product-price` e o texto do preço) ou, com o back-end ligado, em Admin > Produtos (o site atualiza o preço pelo banco).
- Para colocar foto depois: no cartão do produto, adicione antes de `product-card__content` um `<a class="product-card__image-link" href="..."><img class="product-card__image" src="..." alt="..."></a>` e remova a classe `product-card--sem-foto`.
- As setas do teclado trocam de aba; o endereço `#cafe-da-manha` abre direto a aba.

## 2. Foto do início no celular

- Correção em CSS no fim de `assets/css/base.css` (bloco `@media (max-width: 680px)`): altura própria para o celular, enquadramento da foto e degradê vertical. As regras antigas não foram apagadas.
- Causa provável adicional: o `vercel.json` mandava o navegador guardar CSS/JS por **1 ano sem revalidar**, então o celular podia ficar com o CSS antigo. Agora CSS/JS revalidam sempre e imagens ficam 1 dia em cache.
- Não consegui abrir um celular real aqui. Se o enquadramento ainda não agradar, ajuste a posição `62% center` no bloco do celular.

## 3. Back-end (novo, pasta `backend/`)

O back antigo estava espalhado em `assets/js` (arquivos de servidor misturados com o site; o `npm start` apontava para um arquivo que não existia). Foi refeito do zero:

- `backend/servidor.js` (entrada) e `backend/src/` (`app.js`, `config/`, `middlewares/`, `controladores/`, `rotas/`, `servicos/`).
- `api/index.js` permite rodar a API no próprio Vercel (`/api/*`).
- Login com senha criptografada (bcrypt) e JWT. A senha em texto puro que era aceita antes foi eliminada. Há limite de tentativas de login.
- Cargos: 1 Cliente, 2 Atendente, 3 Administrador. O servidor confere o cargo no banco a cada requisição.
- Pedidos: o preço é sempre calculado no servidor (o navegador não manda valor).
- Rotas principais: `/api/auth/*`, `/api/produtos`, `/api/pedidos`, `/api/favoritos`, `/api/usuarios/*`, `/api/minha-avaliacao`, `/api/avaliacoes`, `/api/pagamento/*` e `/api/admin/*` (métricas, pedidos, produtos, estoque, funcionários, avaliações).
- Mercado Pago: cria o pagamento e recebe o aviso em `/api/pagamento/webhook`. Sem `MP_ACCESS_TOKEN` o pedido fica como "Na retirada". **Essa parte não foi testada com conta real.**
- Recuperação de senha por código de 6 dígitos (vale 15 minutos, 5 tentativas). Para enviar e-mail real configure `SMTP_*`; sem isso, em desenvolvimento o código aparece na tela e em produção nada é enviado.
- Foto de perfil: enviada reduzida (256 px) e guardada no banco, então funciona também no Vercel.
- Testes automáticos: `npm run test:api` (10 testes, todos passaram em MariaDB 10.11; precisa de um banco ligado).

## 4. Banco de dados (`banco/schema.sql`)

- Schema único e completo (o de `banco/` e o da raiz eram diferentes; a cópia da raiz foi removida).
- Tabela nova: `avaliacoes`. Colunas novas: `usuarios.ativo`, `reset_codigo_hash`, `reset_expira`, `reset_tentativas`; `pedidos.pagamento_status`, `pagamento_id`; `itens_pedido.nome_produto`. `foto_perfil` virou MEDIUMTEXT.
- Nova categoria "Café da Manhã" (id 4) e os 12 produtos com ids fixos (1 a 6 cafés, 7 a 12 café da manhã).
- `npm run banco:iniciar` cria o banco e também **atualiza um banco antigo**, adicionando o que faltar sem apagar dados.
- `npm run admin:criar` cria (ou promove) o administrador pedindo nome, e-mail e senha.

## 5. Páginas novas

- `paginas/cadastro.html`: criar conta.
- `senha.html`: recuperar senha (estava incompleta e sem botão de envio).
- `paginas/conta.html`: minha conta com dados, foto, trocar senha, meus pedidos (pagar/cancelar), favoritos e avaliação.
- `paginas/pedido-status.html`: acompanhar pedido (volta do pagamento).
- `admin/pedidos.html`, `admin/estoque.html`, `admin/avaliacoes.html`.
- `404.html`.
- Links novos: "Minha conta" no rodapé de todas as páginas públicas, "Criar conta" no login, botão "Favoritar" na página de cada café, "Sair" e novas abas no painel.

## 6. Páginas existentes corrigidas

- `login.html` e `assets/js/login.js`: faziam login falso e o `login.js` tinha código de servidor misturado. Agora autenticam no back e levam ao painel ou à conta.
- `admin/*.html`: o Chart.js tinha endereço quebrado, a visão geral estava com o conteúdo duplicado dentro dele mesmo e "Ver site" apontava para uma pasta que não existe. Agora o painel exige login (atendente ou administrador), produtos têm cadastro/edição/ativar/excluir, funcionários vêm do banco e o painel atualiza sozinho a cada 30 s. A lista fixa de funcionários de demonstração saiu; cadastre a equipe em Admin > Funcionários.
- `paginas/produtos/*.html`: links relativos errados (`../assets` dentro de subpasta) e `../pagina/cardapio.html` (faltava o "s") viraram caminhos que funcionam.
- `assets/js/carrinho.js`: guarda o id do produto e finaliza o pedido de verdade no back. Se o back não estiver no ar, mantém o pedido demonstrativo de antes.
- `assets/js/avaliacoes.js`: além das 3 avaliações fixas, mostra as aprovadas no painel.
- `index.html` (raiz): caminhos corrigidos. `paginas/index.html` é cópia: **edite `index.html` e rode `npm run sincronizar`**.

## 7. Arquivos removidos (cópias antigas ou código de servidor solto)

- Raiz: `avaliacoes.html`, `carrinho.html`, `cardapio.html`, `endereco.html`, `sobre.html`, `funcionarios.html`, `produtos.html`, `admin.css`, `carrinho.css`, `login.css`, `base.css`, `admin.js`, `avaliacoes.js`, `carrinho.js`, `favoritos.js`, `login.js`, `script.js`, `site.js`, `schema.sql`.
- Pasta `pages/` inteira (versão antiga de `paginas/`). Os endereços antigos redirecionam para `paginas/` (no `vercel.json` e no servidor).
- Em `assets/js/`: `api.js`, `app.js`, `banco.js`, `cont-usuario.js`, `express.js`, `favoritos.js`, `pagamento.js`, `script.js`, `servidor.js`, `teste.js` (o que valia está agora em `backend/`).
- `banco/Novo(a) Documento de Texto.txt`.
- Tudo continua no histórico do Git se precisar voltar.

## 8. Outros arquivos mexidos

- `package.json`: scripts novos (`start`, `test:api`, `banco:iniciar`, `admin:criar`, `sincronizar`) e dependências limpas (saíram `mysql`, `site.js` e o `nodemon` antigo; entrou `express-rate-limit`).
- `vercel.json`: API em `/api`, redirecionamentos antigos, cache e cabeçalhos de segurança.
- `scripts/check-project.mjs`: passa a ignorar a pasta `documentacao/` (os arquivos Word/PowerPoint faziam o `npm test` falhar). `npm test` agora passa sem erros.
- `.env.example`: lista de todas as variáveis.
- `assets/css/admin.css` e `base.css`: só foram **acrescentadas** regras no final. `assets/css/conta.css`, `assets/js/config.js` e `assets/js/api-cliente.js` são novos.

## 9. Como rodar no seu computador

1. `npm install`
2. Copie `.env.example` para `.env` e preencha (`JWT_SECRET` com um texto longo e aleatório, `DB_*` do seu MySQL).
3. `npm run banco:iniciar` e depois `npm run admin:criar`.
4. `npm start` e abra `http://localhost:3000`.

## 10. Como colocar no ar (Vercel)

O Vercel não guarda banco. Crie um MySQL na nuvem (Aiven, TiDB Cloud, Railway etc.), rode `npm run banco:iniciar` e `npm run admin:criar` apontando para ele e cadastre no Vercel (Settings > Environment Variables): `JWT_SECRET`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true` (quando o provedor exigir), `BASE_URL=https://mcs-cafe.vercel.app` e, se quiser, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` e `SMTP_*`. Depois faça um novo deploy. Se o back ficar em outro endereço, ponha esse endereço em `assets/js/config.js` (`apiBase`) e o do site em `CORS_ORIGEM`.

Sem back-end no ar o site continua funcionando como antes (cardápio e carrinho demonstrativos). Login, conta, painel e pedidos reais precisam do back.

## 11. Para mexer sem medo

- Página pública nova: copie `paginas/sobre.html` e troque o conteúdo.
- Preço/produto: Admin > Produtos (com back) ou o HTML do cardápio.
- Antes de enviar ao GitHub rode `npm test` (confere links, scripts e nomes) e, com o banco ligado, `npm run test:api`.
- Nunca coloque senha, token ou chave dentro dos arquivos do projeto; use o `.env` (já ignorado pelo Git) e as variáveis do Vercel.
- Nomes de arquivo: minúsculos, sem acento e sem espaço (o `npm test` cobra isso).

## 12. O que eu não consegui validar

- Pagamento real no Mercado Pago, envio de e-mail e o visual em celular real.
- O back foi testado com 10 testes automáticos e o site com um navegador simulado (abas, carrinho, pedido gravado no banco). O CSS do celular não foi visto numa tela real.
