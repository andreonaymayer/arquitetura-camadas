import { Component, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { CategoriaForm } from '../../components/categoria-form/categoria-form';
import { Categoria, CategoriaRequest } from '../../models/categoria';
import { CategoriasActions } from '../../store/categorias/categorias.actions';
import { categoriasFeature } from '../../store/categorias/categorias.reducer';

@Component({
  selector: 'app-categorias',
  imports: [CategoriaForm],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss',
})
export class Categorias implements OnInit {
  private readonly store = inject(Store);

  protected readonly categorias = this.store.selectSignal(categoriasFeature.selectItens);
  protected readonly carregando = this.store.selectSignal(categoriasFeature.selectCarregando);
  protected readonly editando = signal<Categoria | null>(null);

  ngOnInit(): void {
    this.store.dispatch(CategoriasActions.carregar());
  }

  protected salvar(request: CategoriaRequest): void {
    const atual = this.editando();
    if (atual) {
      this.store.dispatch(CategoriasActions.atualizar({ id: atual.id, request }));
      this.editando.set(null);
    } else {
      this.store.dispatch(CategoriasActions.criar({ request }));
    }
  }

  protected editar(categoria: Categoria): void {
    this.editando.set(categoria);
  }

  protected cancelar(): void {
    this.editando.set(null);
  }

  protected remover(categoria: Categoria): void {
    if (confirm(`Remover a categoria "${categoria.nome}"?`)) {
      this.store.dispatch(CategoriasActions.remover({ id: categoria.id }));
    }
  }
}
