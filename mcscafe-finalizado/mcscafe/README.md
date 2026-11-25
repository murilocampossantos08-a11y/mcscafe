# MCS Café

Site e sistema do MCS Café: front em HTML, CSS e JavaScript puros, back-end em Node/Express e banco MySQL. Sem o back-end no ar o site funciona como vitrine com carrinho demonstrativo. Tudo o que foi alterado e como colocar no ar está em [leia-me.md](leia-me.md).

## Rodar no Codespaces

1. Abra o repositório no GitHub Codespaces.
2. No terminal, execute `npm run dev` (só o site) ou `npm start` (site e API, precisa do `.env` e do banco).
3. Abra a porta 3000 na aba **Ports**.

Antes de publicar qualquer mudança, execute `npm test`. O comando verifica sintaxe de JavaScript, nomes de arquivos, estrutura mínima do HTML, links locais e referências a imagens/CSS.

## Estrutura

```text
.
├── admin/                 # Painel administrativo (exige login)
├── api/                   # Entrada da API no Vercel
├── backend/               # Servidor Express, rotas, controladores e testes
├── assets/
│   ├── css/               # Estilos separados por responsabilidade
│   ├── icones/            # Ícones SVG locais
│   ├── imagens/           # Fotos, logo e imagens dos produtos
│   └── js/                # Comportamentos do navegador
├── banco/                 # Schema SQL do MySQL
├── documentacao/          # Guia de Git e decisões da migração
├── paginas/
│   └── produtos/          # Páginas individuais do cardápio
├── scripts/               # Servidor local e verificações sem dependências
├── index.html             # Página inicial, exigida por hospedagens estáticas
└── vercel.json            # Configuração de publicação
```

## Como salvar no GitHub sempre

Use este ciclo curto ao terminar uma pequena alteração:

```bash
git status
git add caminho/do/arquivo
git commit -m "feat: descreve a alteração"
git push
```

Faça um `git pull` antes de começar o dia e use `git status` antes de fechar o Codespace. O Codespace salva arquivos no ambiente, mas somente o `git push` salva a versão no GitHub. O guia completo está em [documentacao/fluxo-github.md](documentacao/fluxo-github.md).

## Publicação pela Vercel

O projeto é estático: não há build nem banco de dados no deploy. Importe o repositório pela Vercel e mantenha a branch `main` como Production Branch. Cada push em uma branch cria um preview; um push ou merge na `main` publica a versão de produção. Não crie um workflow de deploy com token enquanto a integração GitHub → Vercel puder ser usada.

## Próxima etapa: autenticação real

O arquivo [banco/schema.sql](banco/schema.sql) é apenas a base do banco. Para implementar login de verdade, crie um backend separado ou funções serverless, armazene apenas hashes de senha e configure segredos no painel da hospedagem. Não coloque senha, URL privada ou chave de API em arquivos enviados ao GitHub.
