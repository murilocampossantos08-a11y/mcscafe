class ErroValidacao extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

function texto(valor, rotulo, { min = 1, max = 255, opcional = false } = {}) {
  if (valor === undefined || valor === null || valor === '') {
    if (opcional) return null;
    throw new ErroValidacao(`${rotulo} é obrigatório.`);
  }
  if (typeof valor !== 'string') {
    throw new ErroValidacao(`${rotulo} inválido.`);
  }
  const limpo = valor.trim();
  if (limpo.length < min) {
    throw new ErroValidacao(`${rotulo} deve ter pelo menos ${min} caracteres.`);
  }
  if (limpo.length > max) {
    throw new ErroValidacao(`${rotulo} deve ter no máximo ${max} caracteres.`);
  }
  return limpo;
}

function email(valor) {
  const limpo = texto(valor, 'E-mail', { max: 100 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) {
    throw new ErroValidacao('E-mail inválido.');
  }
  return limpo;
}

function senha(valor, rotulo = 'Senha') {
  if (typeof valor !== 'string' || valor.length < 8) {
    throw new ErroValidacao(`${rotulo} deve ter pelo menos 8 caracteres.`);
  }
  if (Buffer.byteLength(valor, 'utf8') > 72) {
    throw new ErroValidacao(`${rotulo} deve ter no máximo 72 caracteres.`);
  }
  return valor;
}

function telefone(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string') throw new ErroValidacao('Telefone inválido.');
  const digitos = valor.replace(/\D/g, '');
  if (digitos.length < 8 || digitos.length > 15) {
    throw new ErroValidacao('Telefone inválido.');
  }
  return digitos;
}

function inteiro(valor, rotulo, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < min || numero > max) {
    throw new ErroValidacao(`${rotulo} inválido.`);
  }
  return numero;
}

function dinheiro(valor, rotulo, { min = 0.01, max = 99999 } = {}) {
  const numero = Number(typeof valor === 'string' ? valor.replace(',', '.') : valor);
  if (!Number.isFinite(numero) || numero < min || numero > max) {
    throw new ErroValidacao(`${rotulo} inválido.`);
  }
  return Math.round(numero * 100) / 100;
}

function booleano(valor, padrao) {
  if (valor === undefined || valor === null) return padrao;
  if (typeof valor === 'boolean') return valor;
  if (valor === 1 || valor === '1' || valor === 'true') return true;
  if (valor === 0 || valor === '0' || valor === 'false') return false;
  throw new ErroValidacao('Valor booleano inválido.');
}

function caminhoImagem(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const limpo = texto(valor, 'Imagem', { max: 255 });
  if (!/^(\/assets\/|https:\/\/)/.test(limpo) || /\s/.test(limpo)) {
    throw new ErroValidacao('Imagem deve começar com /assets/ ou https://.');
  }
  return limpo;
}

module.exports = {
  ErroValidacao,
  texto,
  email,
  senha,
  telefone,
  inteiro,
  dinheiro,
  booleano,
  caminhoImagem,
};
