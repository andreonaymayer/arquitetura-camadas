INSERT INTO categoria (nome, descricao) VALUES
    ('Eletrônicos', 'Aparelhos eletrônicos em geral'),
    ('Livros', 'Livros impressos e digitais'),
    ('Papelaria', 'Material de escritório e escolar');

INSERT INTO produto (codigo, nome, preco, categoria_id) VALUES
    ('NOTE-001', 'Notebook 14 polegadas', 3499.90, (SELECT id FROM categoria WHERE nome = 'Eletrônicos')),
    ('FONE-001', 'Fone de ouvido Bluetooth', 199.90, (SELECT id FROM categoria WHERE nome = 'Eletrônicos')),
    ('LIVRO-001', 'Java: Como Programar', 289.00, (SELECT id FROM categoria WHERE nome = 'Livros')),
    ('CAD-001', 'Caderno universitário', 24.50, (SELECT id FROM categoria WHERE nome = 'Papelaria'));
