CREATE DATABASE IF NOT EXISTS mcscafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mcscafe;

CREATE TABLE IF NOT EXISTS cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE
);

INSERT IGNORE INTO cargos (id, nome) VALUES
(1, 'Cliente'),
(2, 'Atendente'),
(3, 'Administrador');

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    foto_perfil MEDIUMTEXT DEFAULT NULL,
    cargo_id INT NOT NULL DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    reset_codigo_hash CHAR(64) DEFAULT NULL,
    reset_expira DATETIME DEFAULT NULL,
    reset_tentativas INT NOT NULL DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT
);

INSERT IGNORE INTO categorias (id, nome, descricao) VALUES
(1, 'Cafés Expressos', 'Cafés tirados na hora com grãos selecionados'),
(2, 'Bebidas Geladas', 'Frappés, cafés gelados e sucos'),
(3, 'Acompanhamentos', 'Bolos, tortas, salgados e croissants'),
(4, 'Café da Manhã', 'Pães, bolos e lanches para o café da manhã');

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

INSERT IGNORE INTO produtos (id, categoria_id, nome, descricao, preco, imagem_url, disponivel) VALUES
(1, 1, 'Café coado', 'Café coado na hora, com grãos selecionados.', 3.00, '/assets/imagens/menu-1.png', TRUE),
(2, 1, 'Espresso', 'Café intenso, preparado com grãos selecionados.', 5.00, '/assets/imagens/menu-2.png', TRUE),
(3, 1, 'Mocha', 'Espresso com chocolate e leite vaporizado.', 6.00, '/assets/imagens/menu-3.png', TRUE),
(4, 1, 'Cappuccino', 'Espresso com leite vaporizado e espuma cremosa.', 10.00, '/assets/imagens/menu-4.png', TRUE),
(5, 2, 'Cold Brew', 'Café extraído a frio, suave e refrescante.', 13.00, '/assets/imagens/menu-5.png', TRUE),
(6, 1, 'Macchiato', 'Espresso marcado com uma pequena porção de leite.', 15.00, '/assets/imagens/menu-6.png', TRUE),
(7, 4, 'Pão de queijo', 'Pão de queijo quentinho.', 4.00, NULL, TRUE),
(8, 4, 'Bolo de cenoura', 'Fatia de bolo de cenoura com cobertura de chocolate.', 6.00, NULL, TRUE),
(9, 4, 'Bolo de fubá', 'Fatia de bolo de fubá caseiro.', 5.50, NULL, TRUE),
(10, 4, 'Pão na chapa', 'Pão francês na chapa com manteiga.', 5.50, NULL, TRUE),
(11, 4, 'Misto quente', 'Pão, presunto e queijo na chapa.', 9.00, NULL, TRUE),
(12, 4, 'Croissant', 'Croissant folhado e crocante.', 8.00, NULL, TRUE);

CREATE TABLE IF NOT EXISTS favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    produto_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    UNIQUE KEY usuario_produto_unico (usuario_id, produto_id)
);

CREATE TABLE IF NOT EXISTS estoque_insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_insumo VARCHAR(50) NOT NULL,
    quantidade_disponivel DECIMAL(10,2) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    quantidade_minima DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS status_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE
);

INSERT IGNORE INTO status_pedido (id, nome) VALUES
(1, 'Pendente'),
(2, 'Em Preparo'),
(3, 'Pronto para Saída'),
(4, 'Concluído'),
(5, 'Cancelado');

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    status_id INT NOT NULL DEFAULT 1,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    forma_pagamento VARCHAR(30) NOT NULL,
    pagamento_status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    pagamento_id VARCHAR(60) DEFAULT NULL,
    observacoes TEXT,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (status_id) REFERENCES status_pedido(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    nome_produto VARCHAR(100) DEFAULT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
);

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

CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    nota TINYINT NOT NULL,
    comentario TEXT NOT NULL,
    aprovada BOOLEAN NOT NULL DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
