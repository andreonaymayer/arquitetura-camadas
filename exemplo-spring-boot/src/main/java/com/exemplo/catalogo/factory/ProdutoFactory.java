package com.exemplo.catalogo.factory;

import com.exemplo.catalogo.dto.ProdutoResponse;
import com.exemplo.catalogo.entity.Produto;
import org.springframework.stereotype.Component;

@Component
public class ProdutoFactory {

    public ProdutoResponse criarResponse(Produto produto) {
        ProdutoResponse response = new ProdutoResponse();
        response.setId(produto.getId());
        response.setCodigo(produto.getCodigo());
        response.setNome(produto.getNome());
        response.setPreco(produto.getPreco());
        response.setCategoriaId(produto.getCategoria().getId());
        response.setCategoriaNome(produto.getCategoria().getNome());
        return response;
    }
}
