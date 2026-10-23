import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria } from '../../models/categoria';
import { Produto, ProdutoRequest } from '../../models/produto';

@Component({
  selector: 'app-produto-form',
  imports: [ReactiveFormsModule],
  templateUrl: './produto-form.html',
  styleUrl: './produto-form.scss',
})
export class ProdutoForm {
  private readonly fb = inject(FormBuilder);

  readonly produto = input<Produto | null>(null);
  readonly categorias = input.required<Categoria[]>();
  readonly textoBotao = input('Salvar');

  readonly salvar = output<ProdutoRequest>();
  readonly cancelar = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(30)]],
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    preco: [0, [Validators.required, Validators.min(0.01)]],
    categoriaId: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    effect(() => {
      const produto = this.produto();
      if (produto) {
        this.form.setValue({
          codigo: produto.codigo,
          nome: produto.nome,
          preco: produto.preco,
          categoriaId: produto.categoriaId,
        });
      }
    });
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvar.emit(this.form.getRawValue());
  }

  protected invalido(campo: 'codigo' | 'nome' | 'preco' | 'categoriaId'): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && controle.touched;
  }
}
