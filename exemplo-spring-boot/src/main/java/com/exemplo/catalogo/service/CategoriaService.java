package com.exemplo.catalogo.service;

import com.exemplo.catalogo.dto.CategoriaRequest;
import com.exemplo.catalogo.dto.CategoriaResponse;
import com.exemplo.catalogo.entity.Categoria;
import com.exemplo.catalogo.factory.CategoriaFactory;
import com.exemplo.catalogo.repository.CategoriaRepository;
import com.exemplo.catalogo.repository.ProdutoRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProdutoRepository produtoRepository;
    private final CategoriaFactory categoriaFactory;

    public CategoriaService(
            CategoriaRepository categoriaRepository,
            ProdutoRepository produtoRepository,
            CategoriaFactory categoriaFactory) {
        this.categoriaRepository = categoriaRepository;
        this.produtoRepository = produtoRepository;
        this.categoriaFactory = categoriaFactory;
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar() {
        List<CategoriaResponse> respostas = new ArrayList<>();
        for (Categoria categoria : categoriaRepository.findAll()) {
            respostas.add(categoriaFactory.criarResponse(categoria));
        }
        return respostas;
    }

    @Transactional(readOnly = true)
    public CategoriaResponse buscarPorId(Long id) {
        return categoriaFactory.criarResponse(buscarEntidade(id));
    }

    @Transactional
    public CategoriaResponse criar(CategoriaRequest request) {
        if (categoriaRepository.existsByNome(request.getNome())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe categoria com o nome " + request.getNome());
        }
        Categoria categoria = new Categoria();
        categoria.setNome(request.getNome());
        categoria.setDescricao(request.getDescricao());
        return categoriaFactory.criarResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaResponse atualizar(Long id, CategoriaRequest request) {
        Categoria categoria = buscarEntidade(id);
        categoria.setNome(request.getNome());
        categoria.setDescricao(request.getDescricao());
        return categoriaFactory.criarResponse(categoriaRepository.save(categoria));
    }

    @Transactional
    public void remover(Long id) {
        Categoria categoria = buscarEntidade(id);
        if (produtoRepository.existsByCategoriaId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Categoria possui produtos vinculados");
        }
        categoriaRepository.delete(categoria);
    }

    private Categoria buscarEntidade(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));
    }
}
