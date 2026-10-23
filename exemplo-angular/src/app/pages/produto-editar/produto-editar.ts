import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProdutoForm } from '../../components/produto-form/produto-form';
import { NotificacaoService } from '../../core/notificacao.service';
import { Categoria } from '../../models/categoria';
import { Produto, ProdutoRequest } from '../../models/produto';
import { CategoriaService } from '../../services/categoria.service';
import { ProdutoService } from '../../services/produto.service';

@Component({
  selector: 'app-produto-editar',
  imports: [ProdutoForm],
  templateUrl: './produto-editar.html',
  styleUrl: './produto-editar.scss',
})
export class ProdutoEditar implements OnInit {
  private readonly produtoService = inject(ProdutoService);
  private readonly notificacao = inject(NotificacaoService);
  private readonly router = inject(Router);
  private readonly categoriaService = inject(CategoriaService);

  readonly id = input.required<string>();

  protected readonly produto = signal<Produto | null>(null);
  protected readonly categorias = signal<Categoria[]>([]);

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (lista) => this.categorias.set(lista),
      error: () => this.categorias.set([]),
    });
    this.produtoService.buscarPorId(Number(this.id())).subscribe({
      next: (produto) => this.produto.set(produto),
      error: () => this.router.navigate(['/produtos']),
    });
  }

  protected salvar(request: ProdutoRequest): void {
    this.produtoService.atualizar(Number(this.id()), request).subscribe({
      next: () => {
        this.notificacao.sucesso('Produto atualizado');
        this.router.navigate(['/produtos']);
      },
      error: () => undefined,
    });
  }

  protected cancelar(): void {
    this.router.navigate(['/produtos']);
  }
}
