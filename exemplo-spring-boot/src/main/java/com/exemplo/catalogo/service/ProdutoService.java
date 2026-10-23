package com.exemplo.catalogo.service;

import com.exemplo.catalogo.dto.ProdutoRequest;
import com.exemplo.catalogo.dto.ProdutoResponse;
import com.exemplo.catalogo.entity.Categoria;
import com.exemplo.catalogo.entity.Produto;
import com.exemplo.catalogo.repository.CategoriaRepository;
import com.exemplo.catalogo.repository.ProdutoRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final CategoriaRepository categoriaRepository;

    public ProdutoService(ProdutoRepository produtoRepository, CategoriaRepository categoriaRepository) {
        this.produtoRepository = produtoRepository;
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar() {
        List<ProdutoResponse> respostas = new ArrayList<>();
        for (Produto produto : produtoRepository.findAll()) {
            respostas.add(ProdutoResponse.de(produto));
        }
        return respostas;
    }

    @Transactional(readOnly = true)
    public ProdutoResponse buscarPorId(Long id) {
        return ProdutoResponse.de(buscarEntidade(id));
    }

    @Transactional(readOnly = true)
    public ProdutoResponse buscarPorCodigo(String codigo) {
        Produto produto = produtoRepository.findByCodigo(codigo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
        return ProdutoResponse.de(produto);
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> buscarPorCategoriaEFaixaDePreco(
            String categoria, BigDecimal precoMin, BigDecimal precoMax) {
        List<Produto> produtos = produtoRepository.buscarPorCategoriaEFaixaDePreco(categoria, precoMin, precoMax);
        List<ProdutoResponse> respostas = new ArrayList<>();
        for (Produto produto : produtos) {
            respostas.add(ProdutoResponse.de(produto));
        }
        return respostas;
    }

    @Transactional
    public ProdutoResponse criar(ProdutoRequest request) {
        if (produtoRepository.existsByCodigo(request.codigo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe produto com o código " + request.codigo());
        }
        Produto produto = new Produto();
        preencher(produto, request);
        return ProdutoResponse.de(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse atualizar(Long id, ProdutoRequest request) {
        Produto produto = buscarEntidade(id);
        produtoRepository.findByCodigo(request.codigo())
                .filter(existente -> !existente.getId().equals(id))
                .ifPresent(existente -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe produto com o código " + request.codigo());
                });
        preencher(produto, request);
        return ProdutoResponse.de(produtoRepository.save(produto));
    }

    @Transactional
    public void remover(Long id) {
        produtoRepository.delete(buscarEntidade(id));
    }

    private void preencher(Produto produto, ProdutoRequest request) {
        Categoria categoria = categoriaRepository.findById(request.categoriaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria informada não existe"));
        produto.setCodigo(request.codigo());
        produto.setNome(request.nome());
        produto.setPreco(request.preco());
        produto.setCategoria(categoria);
    }

    private Produto buscarEntidade(Long id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
    }
}
