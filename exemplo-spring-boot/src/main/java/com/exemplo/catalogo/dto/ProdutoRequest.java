package com.exemplo.catalogo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProdutoRequest(
        @NotBlank @Size(max = 30) String codigo,
        @NotBlank @Size(max = 120) String nome,
        @NotNull @DecimalMin("0.01") BigDecimal preco,
        @NotNull Long categoriaId) {
}
