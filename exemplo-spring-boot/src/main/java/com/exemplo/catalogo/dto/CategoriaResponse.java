package com.exemplo.catalogo.dto;

import com.exemplo.catalogo.entity.Categoria;

public record CategoriaResponse(Long id, String nome, String descricao) {

    public static CategoriaResponse de(Categoria categoria) {
        return new CategoriaResponse(categoria.getId(), categoria.getNome(), categoria.getDescricao());
    }
}
