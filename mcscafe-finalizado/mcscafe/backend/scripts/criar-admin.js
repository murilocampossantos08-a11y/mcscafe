const readline = require('readline');
const bcrypt = require('bcrypt');
const db = require('../src/config/banco');
const v = require('../src/servicos/validacao');

function perguntar(rotulo, oculto = false) {
  return new Promise((resolver) => {
    const interface_ = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) {
      interface_._writeToOutput = (texto) => {
        if (texto.includes(rotulo)) interface_.output.write(rotulo);
      };
    }
    interface_.question(rotulo, (resposta) => {
      interface_.close();
      if (oculto) process.stdout.write('\n');
      resolver(resposta);
    });
  });
}

async function main() {
  const nome = v.texto(process.env.ADMIN_NOME || (await perguntar('Nome: ')), 'Nome', { min: 2, max: 50 });
  const email = v.email(process.env.ADMIN_EMAIL || (await perguntar('E-mail: ')));
  const senha = v.senha(process.env.ADMIN_SENHA || (await perguntar('Senha (mínimo 8 caracteres): ', true)));
  const hash = await bcrypt.hash(senha, 10);

  await db.query(
    `INSERT INTO usuarios (nome, email, senha, cargo_id, ativo) VALUES (?, ?, ?, 3, TRUE)
     ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha = VALUES(senha), cargo_id = 3, ativo = TRUE`,
    [nome, email, hash],
  );
  console.log(`Administrador pronto: ${email}`);
}

main()
  .catch((erro) => {
    console.error('Falha ao criar administrador:', erro.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
