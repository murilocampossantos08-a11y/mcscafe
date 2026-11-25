const crypto = require('crypto');
require('dotenv').config({ quiet: true });

const producao = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (producao) {
    throw new Error('Defina JWT_SECRET nas variáveis de ambiente.');
  }
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn('JWT_SECRET ausente: usando chave temporária. As sessões caem ao reiniciar o servidor.');
}

function lista(valor) {
  return (valor || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  producao,
  porta: Number(process.env.PORT) || 3000,
  jwtSecret,
  jwtExpira: process.env.JWT_EXPIRA || '8h',
  baseUrl: (process.env.BASE_URL || '').replace(/\/$/, ''),
  corsOrigens: lista(process.env.CORS_ORIGEM),
  servirSite: process.env.SERVIR_SITE !== 'false' && !process.env.VERCEL,
  confiarProxy: Boolean(process.env.VERCEL) || process.env.TRUST_PROXY === 'true',
  banco: {
    host: process.env.DB_HOST || 'localhost',
    porta: Number(process.env.DB_PORT) || 3306,
    usuario: process.env.DB_USER || 'root',
    senha: process.env.DB_PASSWORD || '',
    nome: process.env.DB_NAME || 'mcscafe',
    ssl: process.env.DB_SSL === 'true',
    sslRejeitarNaoAutorizado: process.env.DB_SSL_REJEITAR !== 'false',
  },
  mercadoPago: {
    token: process.env.MP_ACCESS_TOKEN || '',
    segredoWebhook: process.env.MP_WEBHOOK_SECRET || '',
  },
  email: {
    host: process.env.SMTP_HOST || '',
    porta: Number(process.env.SMTP_PORT) || 587,
    seguro: process.env.SMTP_SECURE === 'true',
    usuario: process.env.SMTP_USER || '',
    senha: process.env.SMTP_PASS || '',
    remetente: process.env.SMTP_FROM || 'MCS Café <nao-responder@mcscafe.local>',
  },
};
