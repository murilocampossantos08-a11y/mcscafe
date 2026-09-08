CREATE DATABASE IF NOT EXISTS mcscafe;
USE mcscafe;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(35) NOT NULL UNIQUE,
    senha VARCHAR(15) NOT NULL
);

-- Usuário de teste (email: teste@mcscafe.com | senha: 123)
INSERT INTO usuarios (email, senha) VALUES ('teste@mcscafe.com', '123');

-- 1. Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS mcscafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mcscafe;

-- 2. Tabela de Níveis de Acesso / Cargos (Para diferenciar Cliente, Atendente e Admin)
CREATE TABLE IF NOT EXISTS cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO cargos (nome) VALUES ('Cliente'), ('Atendente'), ('Administrador');

-- 3. Tabela de Usuários (Login e Dados Pessoais)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL,
    email VARCHAR(35) NOT NULL UNIQUE,
    senha VARCHAR(15) NOT NULL,
    telefone VARCHAR(11),
    cargo_id INT NOT NULL DEFAULT 1,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cargo_id) REFERENCES cargos(id)
);

-- 4. Tabela de Categorias do Cardápio (Ex: Bebidas Quentes, Bebidas Geladas, Salgados, Doces)
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE,
    descricao TEXT
);

INSERT INTO categorias (nome, descricao) VALUES 
('Cafés Expressos', 'Cafés tirados na hora com grãos selecionados'),
('Bebidas Geladas', 'Frappés, cafés gelados e sucos'),
('Acompanhamentos', 'Bolos, tortas, salgados e croissants');

-- 5. Tabela de Produtos (Cardápio)
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nome VARCHAR(30) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    imagem_url VARCHAR(255),
    disponivel BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- 6. Tabela de Estoque de Insumos (Controle do grão de café, leite, xaropes, etc.)
CREATE TABLE IF NOT EXISTS estoque_insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_insumo VARCHAR(20) NOT NULL,
    quantidade_disponivel DECIMAL(10,2) NOT NULL, -- Ex: em Kg ou Litros
    unidade_medida VARCHAR(20) NOT NULL, -- Ex: 'kg', 'litros', 'unidades'
    quantidade_minima DECIMAL(10,2) NOT NULL -- Para alertas de estoque baixo
);

-- 7. Tabela de Status do Pedido
CREATE TABLE IF NOT EXISTS status_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO status_pedido (nome) VALUES 
('Pendente'),       -- Aguardando confirmação/pagamento
('Em Preparo'),     -- Café sendo preparado
('Pronto para Saída'), -- Aguardando retirada ou entrega
('Concluído'),      -- Entregue ao cliente (Saída final)
('Cancelado');

-- 8. Tabela Principais de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    status_id INT NOT NULL DEFAULT 1,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    forma_pagamento VARCHAR(7) NOT NULL, -- Ex: 'Pix', 'Cartão de Crédito', 'Dinheiro'
    observacoes TEXT,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (status_id) REFERENCES status_pedido(id)
);

-- 9. Tabela de Itens do Pedido (Relacionamento N:N entre Pedidos e Produtos)
CREATE TABLE IF NOT EXISTS itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- 10. Tabela de Saída / Historico de Modificações do Pedido (Rastreabilidade)
CREATE TABLE IF NOT EXISTS historico_saida_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    status_anterior_id INT,
    status_novo_id INT NOT NULL,
    atualizado_por_usuario_id INT, -- Atendente ou Admin que liberou a saída
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (status_anterior_id) REFERENCES status_pedido(id),
    FOREIGN KEY (status_novo_id) REFERENCES status_pedido(id),
    FOREIGN KEY (atualizado_por_usuario_id) REFERENCES usuarios(id)
);

USE mcscafe;

-- Cadastrar alguns produtos
INSERT INTO produtos (categoria_id, nome, descricao, preco) VALUES
(1, 'Café Expresso Tradicional', 'Café expresso encorpado 50ml', 6.50),
(1, 'Cappuccino Especial MCS', 'Café expresso, leite vaporizado, cacau e canela', 12.00),
(2, 'Frappuccino Doce de Leite', 'Café gelado batido com sorvete e doce de leite', 18.50),
(3, 'Croissant de Presunto e Queijo', 'Massa folhada artesanal recheada', 11.00);

-- Cadastrar Insumos para Estoque
INSERT INTO estoque_insumos (nome_insumo, quantidade_disponivel, unidade_medida, quantidade_minima) VALUES
('Grãos de Café Orfeu', 30.000, 'kg', 3.000),
('Leite Integral', 1.647, 'litros', 300),
('Copo Descartável 300ml', 200.00, 'unidades', 150.00);

-- Exemplo de Pedido Completo (Simulação):
-- 1. Criação do Pedido pelo Usuário (ID 1 - Usuário de Teste)
INSERT INTO pedidos (usuario_id, status_id, valor_total, forma_pagamento) 
VALUES (1, 1, 18.50, 'Pix');

-- 2. Itens Adicionados ao Pedido Criado (ID do Pedido: 1)
INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario, subtotal) 
VALUES (1, 2, 1, 12.00, 12.00), -- 1x Cappuccino
       (1, 1, 1, 6.50, 6.50);    -- 1x Expresso

-- 3. Atualizar o Pedido para Saída / Entrega
UPDATE pedidos SET status_id = 4 WHERE id = 1; -- Altera status para 'Concluído'

-- 4. Registrar no Histórico de Saída
INSERT INTO historico_saida_pedidos (pedido_id, status_anterior_id, status_novo_id, atualizado_por_usuario_id) 
VALUES (1, 1, 4, 1);