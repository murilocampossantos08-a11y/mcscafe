# Fluxo de trabalho no GitHub e Codespaces

## Regra principal

Arquivos salvos no editor não estão automaticamente no GitHub. Uma alteração só fica protegida no repositório remoto depois de um `git push` bem-sucedido.

## Rotina diária

1. Antes de editar, rode `git pull` para receber mudanças remotas.
2. Faça uma alteração pequena e coerente.
3. Rode `npm test` e abra o site com `npm run dev`.
4. Veja exatamente o que mudou com `git status` e `git diff`.
5. Adicione somente os arquivos relacionados: `git add paginas/cardapio.html`.
6. Crie um commit descritivo: `git commit -m "fix: corrige link do cardapio"`.
7. Envie para o GitHub: `git push`.

## Mensagens de commit

Use uma frase curta no imperativo. Alguns exemplos:

- `feat: adiciona produto ao cardapio`
- `fix: corrige contador do carrinho`
- `style: ajusta espaco do cabecalho no celular`
- `docs: explica publicacao na vercel`
- `chore: organiza imagens do projeto`

## Antes de abrir um pull request

- `npm test` terminou sem erro.
- Os links principais foram clicados localmente.
- Não há arquivos estranhos ou segredos no `git status`.
- O título explica a mudança para alguém que não acompanhou o trabalho.

## Recuperação

Se uma alteração local der errado, não apague tudo. Primeiro use `git diff` para entender o que mudou. Se algo já foi salvo em commit, o histórico do GitHub permite voltar a uma versão anterior.
