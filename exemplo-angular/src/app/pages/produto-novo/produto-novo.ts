import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProdutoForm } from '../../components/produto-form/produto-form';
import { NotificacaoService } from '../../core/notificacao.service';
import { Categoria } from '../../models/categoria';
import { ProdutoRequest } from '../../models/produto';
import { CategoriaService } from '../../services/categoria.service';
import { ProdutoService } from '../../services/produto.service';

@Component({
  selector: 'app-produto-novo',
  imports: [ProdutoForm],
  templateUrl: './produto-novo.html',
  styleUrl: './produto-novo.scss',
})
export class ProdutoNovo implements OnInit {
  private readonly produtoService = inject(ProdutoService);
  private readonly notificacao = inject(NotificacaoService);
  private readonly router = inject(Router);
  private readonly categoriaService = inject(CategoriaService);

  protected readonly categorias = signal<Categoria[]>([]);

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (lista) => this.categorias.set(lista),
      error: () => this.categorias.set([]),
    });
  }

  protected salvar(request: ProdutoRequest): void {
    this.produtoService.criar(request).subscribe({
      next: () => {
        this.notificacao.sucesso('Produto criado');
        this.router.navigate(['/produtos']);
      },
      error: () => undefined,
    });
  }

  protected cancelar(): void {
    this.router.navigate(['/produtos']);
  }
}
