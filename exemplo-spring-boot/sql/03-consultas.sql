SELECT * FROM categoria;

SELECT * FROM produto;

SELECT * FROM produto WHERE codigo = 'NOTE-001';

SELECT p.id,
       p.codigo,
       p.nome,
       p.preco,
       c.nome AS categoria_nome
  FROM produto p
  JOIN categoria c ON c.id = p.categoria_id
 WHERE c.nome ILIKE 'eletrônicos'
   AND p.preco BETWEEN 1000 AND 5000
 ORDER BY p.preco ASC;

SELECT c.nome AS categoria,
       COUNT(p.id) AS total_produtos
  FROM categoria c
  LEFT JOIN produto p ON p.categoria_id = c.id
 GROUP BY c.nome
 ORDER BY c.nome;
