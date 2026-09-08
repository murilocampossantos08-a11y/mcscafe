# Decisões da cópia organizada

O projeto original foi preservado sem alteração. Esta cópia corrige a organização e os problemas que impediam uma publicação estática previsível.

| Antes                                                              | Agora                                                                        | Motivo                                                                       |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `pags.html/` misturava nome de pasta e extensão                    | `paginas/` separa páginas e produtos                                         | Nomes consistentes e sem acentos/capitalização variável                      |
| `img/` tinha imagens, ícones, capturas e até um arquivo JavaScript | `assets/imagens/` recebe apenas imagens usadas e `assets/icones/` recebe SVG | Cada tipo de arquivo tem uma responsabilidade                                |
| Código do carrinho repetido em várias páginas                      | `assets/js/carrinho.js`                                                      | Uma correção passa a valer para todo o site                                  |
| Navegador, Chart.js, Express e MySQL no mesmo `script.js`          | Código de navegador separado; backend deixado como próxima etapa documentada | O navegador não deve executar `require`, `app.listen` ou acessar MySQL local |
| Ícones de carrinho e redes sociais em PNG                          | SVGs locais                                                                  | Menos peso e nitidez em qualquer tamanho                                     |
| Arquivos com casos divergentes (`Mocha.html`, `Café-Coado.html`)   | nomes minúsculos, ASCII e kebab-case                                         | Evita links que funcionam no Windows e quebram no Linux/Vercel               |

O visual preserva a paleta escura, dourado/caramelo, imagens, cardápio, avaliações e carrinho. As mudanças visuais são deliberadamente pequenas: acessibilidade, espaçamento, responsividade e estados de foco.
