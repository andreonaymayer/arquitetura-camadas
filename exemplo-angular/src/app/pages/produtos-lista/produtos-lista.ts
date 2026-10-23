import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProdutoTabela } from '../../components/produto-tabela/produto-tabela';
import { NotificacaoService } from '../../core/notificacao.service';
import { Produto, ProdutoBusca } from '../../models/produto';
import { ProdutoService } from '../../services/produto.service';

@Component({
  selector: 'app-produtos-lista',
  imports: [RouterLink, ProdutoTabela],
  templateUrl: './produtos-lista.html',
  styleUrl: './produtos-lista.scss',
})
export class ProdutosLista implements OnInit {
  private readonly produtoService = inject(ProdutoService);
  private readonly notificacao = inject(NotificacaoService);
  private readonly router = inject(Router);

  protected readonly produtos = signal<Produto[]>([]);
  protected readonly filtroNome = signal('');

  protected readonly produtosFiltrados = computed(() => {
    const filtro = this.filtroNome().trim().toLowerCase();
    return this.produtos().filter((produto) => produto.nome.toLowerCase().includes(filtro));
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected filtrar(evento: Event): void {
    this.filtroNome.set((evento.target as HTMLInputElement).value);
  }

  protected buscarPorCodigo(codigo: string): void {
    const valor = codigo.trim();
    if (!valor) {
      this.carregar();
      return;
    }
    this.produtoService.buscarPorCodigo(valor).subscribe({
      next: (produto) => this.produtos.set([produto]),
      error: () => this.produtos.set([]),
    });
  }

  protected editar(id: number): void {
    this.router.navigate(['/editar/produto', id]);
  }

  protected remover(produto: ProdutoBusca): void {
    if (!confirm(`Remover o produto "${produto.nome}"?`)) {
      return;
    }
    this.produtoService.remover(produto.id).subscribe({
      next: () => {
        this.notificacao.sucesso('Produto removido');
        this.carregar();
      },
      error: () => undefined,
    });
  }

  private carregar(): void {
    this.produtoService.listar().subscribe({
      next: (lista) => this.produtos.set(lista),
      error: () => this.produtos.set([]),
    });
  }
}
