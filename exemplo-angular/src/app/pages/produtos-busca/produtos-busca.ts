import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProdutoTabela } from '../../components/produto-tabela/produto-tabela';
import { Categoria } from '../../models/categoria';
import { ProdutoBusca } from '../../models/produto';
import { CategoriaService } from '../../services/categoria.service';
import { ProdutoService } from '../../services/produto.service';

@Component({
  selector: 'app-produtos-busca',
  imports: [ReactiveFormsModule, ProdutoTabela],
  templateUrl: './produtos-busca.html',
  styleUrl: './produtos-busca.scss',
})
export class ProdutosBusca implements OnInit {
  private readonly produtoService = inject(ProdutoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly fb = inject(FormBuilder);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly resultado = signal<ProdutoBusca[] | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    categoria: ['', [Validators.required]],
    precoMin: [0, [Validators.required, Validators.min(0)]],
    precoMax: [10000, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (lista) => this.categorias.set(lista),
      error: () => this.categorias.set([]),
    });
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
