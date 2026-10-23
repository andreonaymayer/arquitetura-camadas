package com.exemplo.catalogo.dto;

import com.exemplo.catalogo.entity.Produto;
import java.math.BigDecimal;

public record ProdutoResponse(
        Long id,
        String codigo,
        String nome,
        BigDecimal preco,
        Long categoriaId,
        String categoriaNome) {

    public static ProdutoResponse de(Produto produto) {
        return new ProdutoResponse(
                produto.getId(),
                produto.getCodigo(),
                produto.getNome(),
                produto.getPreco(),
                produto.getCategoria().getId(),
                produto.getCategoria().getNome());
    }
}
