import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ProdutoForm } from '../../components/produto-form/produto-form';
import { NotificacaoService } from '../../core/notificacao.service';
import { Produto, ProdutoRequest } from '../../models/produto';
import { ProdutoService } from '../../services/produto.service';
import { CategoriasActions } from '../../store/categorias/categorias.actions';
import { categoriasFeature } from '../../store/categorias/categorias.reducer';

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
  private readonly store = inject(Store);

  readonly id = input.required<string>();

  protected readonly produto = signal<Produto | null>(null);
  protected readonly categorias = this.store.selectSignal(categoriasFeature.selectItens);

  ngOnInit(): void {
    this.store.dispatch(CategoriasActions.carregar());
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
