package com.exemplo.catalogo.dto;

import java.math.BigDecimal;

public interface ProdutoPorCategoriaResponse {

    Long getId();

    String getCodigo();

    String getNome();

    BigDecimal getPreco();

    String getCategoriaNome();
}
