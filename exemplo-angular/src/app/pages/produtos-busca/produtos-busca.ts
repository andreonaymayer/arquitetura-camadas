import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ProdutoTabela } from '../../components/produto-tabela/produto-tabela';
import { ProdutoBusca } from '../../models/produto';
import { ProdutoService } from '../../services/produto.service';
import { CategoriasActions } from '../../store/categorias/categorias.actions';
import { categoriasFeature } from '../../store/categorias/categorias.reducer';

@Component({
  selector: 'app-produtos-busca',
  imports: [ReactiveFormsModule, ProdutoTabela],
  templateUrl: './produtos-busca.html',
  styleUrl: './produtos-busca.scss',
})
export class ProdutosBusca implements OnInit {
  private readonly produtoService = inject(ProdutoService);
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);

  protected readonly categorias = this.store.selectSignal(categoriasFeature.selectItens);
  protected readonly resultado = signal<ProdutoBusca[] | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    categoria: ['', [Validators.required]],
    precoMin: [0, [Validators.required, Validators.min(0)]],
    precoMax: [10000, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.store.dispatch(CategoriasActions.carregar());
  }

  protected buscar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { categoria, precoMin, precoMax } = this.form.getRawValue();
    this.produtoService.buscarPorCategoriaEFaixaDePreco(categoria, precoMin, precoMax).subscribe({
      next: (lista) => this.resultado.set(lista),
      error: () => this.resultado.set(null),
    });
  }
}
