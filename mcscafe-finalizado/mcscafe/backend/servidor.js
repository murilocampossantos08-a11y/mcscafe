const app = require('./src/app');
const { porta, servirSite } = require('./src/config/ambiente');
const db = require('./src/config/banco');

app.listen(porta, () => {
  console.log(`Servidor MCS Café rodando na porta ${porta}`);
  console.log(servirSite ? `Site e API em http://localhost:${porta}` : `API em http://localhost:${porta}/api`);
  db.testarConexao().then(
    () => console.log('Conexão com o banco realizada com sucesso.'),
    (erro) => console.error(`Falha na conexão com o banco (${erro.code || erro.message}). Confira o arquivo .env e rode npm run banco:iniciar.`),
  );
});
