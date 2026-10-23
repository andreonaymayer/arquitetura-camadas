package com.exemplo.catalogo.service;

import com.exemplo.catalogo.dto.CategoriaRequest;
import com.exemplo.catalogo.dto.CategoriaResponse;
import com.exemplo.catalogo.entity.Categoria;
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

    public CategoriaService(CategoriaRepository categoriaRepository, ProdutoRepository produtoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.produtoRepository = produtoRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar() {
        List<CategoriaResponse> respostas = new ArrayList<>();
        for (Categoria categoria : categoriaRepository.findAll()) {
            respostas.add(CategoriaResponse.de(categoria));
        }
        return respostas;
    }

    @Transactional(readOnly = true)
    public CategoriaResponse buscarPorId(Long id) {
        return CategoriaResponse.de(buscarEntidade(id));
    }

    @Transactional
    public CategoriaResponse criar(CategoriaRequest request) {
        if (categoriaRepository.existsByNome(request.nome())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe categoria com o nome " + request.nome());
        }
        Categoria categoria = new Categoria();
        categoria.setNome(request.nome());
        categoria.setDescricao(request.descricao());
        return CategoriaResponse.de(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaResponse atualizar(Long id, CategoriaRequest request) {
        Categoria categoria = buscarEntidade(id);
        categoria.setNome(request.nome());
        categoria.setDescricao(request.descricao());
        return CategoriaResponse.de(categoriaRepository.save(categoria));
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
