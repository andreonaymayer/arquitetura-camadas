import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ProdutoBusca } from '../../models/produto';

@Component({
  selector: 'app-produto-tabela',
  imports: [CurrencyPipe],
  templateUrl: './produto-tabela.html',
  styleUrl: './produto-tabela.scss',
})
export class ProdutoTabela {
  readonly produtos = input.required<ProdutoBusca[]>();
  readonly mostrarAcoes = input(true);

  readonly editar = output<number>();
  readonly remover = output<ProdutoBusca>();
}
