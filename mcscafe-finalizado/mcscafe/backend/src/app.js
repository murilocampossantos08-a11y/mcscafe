const path = require('path');
const express = require('express');
const cors = require('cors');
const { corsOrigens, servirSite, confiarProxy } = require('./config/ambiente');
const rotas = require('./rotas');
const { naoEncontrado, tratarErros } = require('./middlewares/erros');

const raiz = path.resolve(__dirname, '../..');
const app = express();

app.disable('x-powered-by');
if (confiarProxy) app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors({ origin: corsOrigens.length ? corsOrigens : false }));
app.use(express.json({ limit: '700kb' }));

app.use('/api', rotas, naoEncontrado);

if (servirSite) {
  const redirecionamentos = {
    '/cardapio': '/paginas/cardapio.html',
    '/sobre': '/paginas/sobre.html',
    '/avaliacoes': '/paginas/avaliacoes.html',
    '/carrinho': '/paginas/carrinho.html',
    '/endereco': '/paginas/endereco.html',
    '/produtos': '/admin/produtos.html',
    '/funcionarios': '/admin/funcionarios.html',
  };

  for (const [origem, destino] of Object.entries(redirecionamentos)) {
    app.get([origem, `${origem}.html`], (req, res) => res.redirect(301, destino));
  }
  app.get('/pages/*caminho', (req, res) => res.redirect(301, `/paginas/${[].concat(req.params.caminho).join('/')}`));

  const opcoes = {
    extensions: ['html'],
    dotfiles: 'ignore',
    setHeaders(res, arquivo) {
      const imagem = /\.(png|jpe?g|webp|svg|ico)$/i.test(arquivo);
      res.setHeader('Cache-Control', imagem ? 'public, max-age=86400' : 'no-cache');
    },
  };

  for (const pasta of ['assets', 'paginas', 'admin']) {
    app.use(`/${pasta}`, express.static(path.join(raiz, pasta), opcoes));
  }

  const paginasDaRaiz = { '/': 'index.html', '/index': 'index.html', '/login': 'login.html', '/senha': 'senha.html' };
  for (const [rota, arquivo] of Object.entries(paginasDaRaiz)) {
    app.get([rota, `${rota === '/' ? '/index' : rota}.html`], (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(raiz, arquivo));
    });
  }

  app.use((req, res) => {
    res.status(404).sendFile(path.join(raiz, '404.html'));
  });
}

app.use(tratarErros);

module.exports = app;
