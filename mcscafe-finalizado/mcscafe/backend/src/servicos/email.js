const nodemailer = require('nodemailer');
const { email: config } = require('../config/ambiente');

let transporte = null;

function configurado() {
  return Boolean(config.host);
}

function obterTransporte() {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: config.host,
      port: config.porta,
      secure: config.seguro,
      auth: config.usuario ? { user: config.usuario, pass: config.senha } : undefined,
    });
  }
  return transporte;
}

async function enviar({ para, assunto, texto }) {
  if (!configurado()) return false;
  await obterTransporte().sendMail({ from: config.remetente, to: para, subject: assunto, text: texto });
  return true;
}

module.exports = { configurado, enviar };
