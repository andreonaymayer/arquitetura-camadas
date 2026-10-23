import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ProdutoForm } from '../../components/produto-form/produto-form';
import { NotificacaoService } from '../../core/notificacao.service';
import { ProdutoRequest } from '../../models/produto';
import { ProdutoService } from '../../services/produto.service';
import { CategoriasActions } from '../../store/categorias/categorias.actions';
import { categoriasFeature } from '../../store/categorias/categorias.reducer';

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
  private readonly store = inject(Store);

  protected readonly categorias = this.store.selectSignal(categoriasFeature.selectItens);

  ngOnInit(): void {
    this.store.dispatch(CategoriasActions.carregar());
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
