-- Modelo para uma futura API. Este arquivo não é usado pelo site estático.
-- Nunca armazene senhas em texto puro: use um hash gerado pelo backend.

CREATE DATABASE IF NOT EXISTS mcscafe
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mcscafe;

CREATE TABLE cargos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE
);
CREATE TABLE usuarios (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  cargo_id BIGINT UNSIGNED NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_cargos
    FOREIGN KEY (cargo_id) REFERENCES cargos(id)
);

CREATE TABLE categorias (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  descricao VARCHAR(255) NULL
);

CREATE TABLE produtos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoria_id BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_produtos_preco_positivo CHECK (preco >= 0),
  CONSTRAINT fk_produtos_categorias
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE pedidos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NULL,
  valor_total DECIMAL(10, 2) NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_pedidos_total_positivo CHECK (valor_total >= 0),
  CONSTRAINT fk_pedidos_usuarios
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE itens_pedido (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id BIGINT UNSIGNED NOT NULL,
  produto_id BIGINT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  CONSTRAINT chk_itens_quantidade_positiva CHECK (quantidade > 0),
  CONSTRAINT chk_itens_preco_positivo CHECK (preco_unitario >= 0),
  CONSTRAINT fk_itens_pedidos
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  CONSTRAINT fk_itens_produtos
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);
