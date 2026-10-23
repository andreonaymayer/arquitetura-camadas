package com.exemplo.catalogo.factory;

import com.exemplo.catalogo.dto.CategoriaResponse;
import com.exemplo.catalogo.entity.Categoria;
import org.springframework.stereotype.Component;

@Component
public class CategoriaFactory {

    public CategoriaResponse criarResponse(Categoria categoria) {
        CategoriaResponse response = new CategoriaResponse();
        response.setId(categoria.getId());
        response.setNome(categoria.getNome());
        response.setDescricao(categoria.getDescricao());
        return response;
    }
}
