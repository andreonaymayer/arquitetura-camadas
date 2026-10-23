package com.exemplo.catalogo.controller;

import com.exemplo.catalogo.dto.ProdutoPorCategoriaResponse;
import com.exemplo.catalogo.dto.ProdutoRequest;
import com.exemplo.catalogo.dto.ProdutoResponse;
import com.exemplo.catalogo.service.ProdutoService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/produtos")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @GetMapping
    public List<ProdutoResponse> listar() {
        return produtoService.listar();
    }

    @GetMapping("/{id}")
    public ProdutoResponse buscarPorId(@PathVariable Long id) {
        return produtoService.buscarPorId(id);
    }

    @GetMapping("/codigo/{codigo}")
    public ProdutoResponse buscarPorCodigo(@PathVariable String codigo) {
        return produtoService.buscarPorCodigo(codigo);
    }

    @GetMapping("/busca")
    public List<ProdutoPorCategoriaResponse> buscarPorCategoriaEFaixaDePreco(
            @RequestParam String categoria,
            @RequestParam BigDecimal precoMin,
            @RequestParam BigDecimal precoMax) {
        return produtoService.buscarPorCategoriaEFaixaDePreco(categoria, precoMin, precoMax);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoResponse criar(@Valid @RequestBody ProdutoRequest request) {
        return produtoService.criar(request);
    }

    @PutMapping("/{id}")
    public ProdutoResponse atualizar(@PathVariable Long id, @Valid @RequestBody ProdutoRequest request) {
        return produtoService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        produtoService.remover(id);
    }
}
