-- BANCO DE DADOS COMPLETO - MCS CAFÉ
-- Compatível com MySQL 8.4 LTS e 9.x

CREATE DATABASE IF NOT EXISTS mcscafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mcscafe;

-- 1. TABELA DE CARGOS / NÍVEIS DE ACESSO
CREATE TABLE IF NOT EXISTS cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO cargos (id, nome) VALUES
(1, 'Cliente'),
(2, 'Atendente'),
(3, 'Administrador') AS novos_dados
ON DUPLICATE KEY UPDATE nome=novos_dados.nome;

-- 2. TABELA DE USUÁRIOS (Login, Perfil e Funcionários)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    foto_perfil VARCHAR(255) DEFAULT NULL,
    cargo_id INT NOT NULL DEFAULT 1,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE RESTRICT
);

-- 3. TABELA DE CATEGORIAS DO CARDÁPIO
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT
);

INSERT INTO categorias (id, nome, descricao) VALUES
(1, 'Cafés Expressos', 'Cafés tirados na hora com grãos selecionados'),
(2, 'Bebidas Geladas', 'Frappés, cafés gelados e sucos'),
(3, 'Acompanhamentos', 'Bolos, tortas, salgados e croissants') AS novas_categorias
ON DUPLICATE KEY UPDATE nome = novas_categorias.nome,
descricao = novas_categorias.descricao;

-- 4. TABELA DE PRODUTOS (Cardápio)
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    imagem_url VARCHAR(255),
    disponivel BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
);

-- 5. TABELA DE FAVORITOS (Relacionamento Usuário x Produto)
CREATE TABLE IF NOT EXISTS favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    produto_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    UNIQUE KEY usuario_produto_unico (usuario_id, produto_id)
);

-- 6. TABELA DE ESTOQUE DE INSUMOS
CREATE TABLE IF NOT EXISTS estoque_insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_insumo VARCHAR(50) NOT NULL,
    quantidade_disponivel DECIMAL(10,2) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    quantidade_minima DECIMAL(10,2) NOT NULL
);

-- 7. TABELA DE STATUS DO PEDIDO
CREATE TABLE IF NOT EXISTS status_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO status_pedido (id, nome) VALUES
(1, 'Pendente'),
(2, 'Em Preparo'),
(3, 'Pronto para Saída'),
(4, 'Concluído'),
(5, 'Cancelado') AS novo_pedido
ON DUPLICATE KEY UPDATE nome= status_pedido.nome;

-- 8. TABELA DE VENDAS / PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    status_id INT NOT NULL DEFAULT 1,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    forma_pagamento VARCHAR(30) NOT NULL,
    observacoes TEXT,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (status_id) REFERENCES status_pedido(id) ON DELETE RESTRICT
);

-- 9. TABELA DE ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
);

-- 10. HISTÓRICO DE SAÍDA E MODIFICAÇÃO DE PEDIDOS
CREATE TABLE IF NOT EXISTS historico_saida_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    status_anterior_id INT,
    status_novo_id INT NOT NULL,
    atualizado_por_usuario_id INT,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (status_anterior_id) REFERENCES status_pedido(id) ON DELETE SET NULL,
    FOREIGN KEY (status_novo_id) REFERENCES status_pedido(id) ON DELETE RESTRICT,
    FOREIGN KEY (atualizado_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
