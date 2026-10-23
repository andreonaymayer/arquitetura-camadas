package com.exemplo.catalogo.repository;

import com.exemplo.catalogo.dto.ProdutoPorCategoriaResponse;
import com.exemplo.catalogo.entity.Produto;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    Optional<Produto> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    boolean existsByCategoriaId(Long categoriaId);

    @Query(value = """
            SELECT p.id AS id,
                   p.codigo AS codigo,
                   p.nome AS nome,
                   p.preco AS preco,
                   c.nome AS categoriaNome
              FROM produto p
              JOIN categoria c ON c.id = p.categoria_id
             WHERE c.nome ILIKE :categoria
               AND p.preco BETWEEN :precoMin AND :precoMax
             ORDER BY p.preco ASC
            """, nativeQuery = true)
    List<ProdutoPorCategoriaResponse> buscarPorCategoriaEFaixaDePreco(
            @Param("categoria") String categoria,
            @Param("precoMin") BigDecimal precoMin,
            @Param("precoMax") BigDecimal precoMax);
}
