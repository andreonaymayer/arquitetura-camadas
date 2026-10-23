import { Component, OnInit, inject, signal } from '@angular/core';
import { CategoriaForm } from '../../components/categoria-form/categoria-form';
import { NotificacaoService } from '../../core/notificacao.service';
import { Categoria, CategoriaRequest } from '../../models/categoria';
import { CategoriaService } from '../../services/categoria.service';

@Component({
  selector: 'app-categorias',
  imports: [CategoriaForm],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss',
})
export class Categorias implements OnInit {
  private readonly categoriaService = inject(CategoriaService);
  private readonly notificacao = inject(NotificacaoService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly editando = signal<Categoria | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  protected salvar(request: CategoriaRequest): void {
    const atual = this.editando();
    if (atual) {
      this.categoriaService.atualizar(atual.id, request).subscribe({
        next: () => {
          this.notificacao.sucesso('Categoria atualizada');
          this.editando.set(null);
          this.carregar();
        },
        error: () => undefined,
      });
    } else {
      this.categoriaService.criar(request).subscribe({
        next: () => {
          this.notificacao.sucesso('Categoria criada');
          this.carregar();
        },
        error: () => undefined,
      });
    }
  }

  protected editar(categoria: Categoria): void {
    this.editando.set(categoria);
  }

  protected cancelar(): void {
    this.editando.set(null);
  }

  protected remover(categoria: Categoria): void {
    if (!confirm(`Remover a categoria "${categoria.nome}"?`)) {
      return;
    }
    this.categoriaService.remover(categoria.id).subscribe({
      next: () => {
        this.notificacao.sucesso('Categoria removida');
        this.carregar();
      },
      error: () => undefined,
    });
  }

  private carregar(): void {
    this.categoriaService.listar().subscribe({
      next: (lista) => this.categorias.set(lista),
      error: () => this.categorias.set([]),
    });
  }
}
