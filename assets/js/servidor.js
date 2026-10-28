const app = require('./src/api');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor MCS Café rodando na porta ${PORT}`);
});
