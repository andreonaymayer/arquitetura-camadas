import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria, CategoriaRequest } from '../../models/categoria';

@Component({
  selector: 'app-categoria-form',
  imports: [ReactiveFormsModule],
  templateUrl: './categoria-form.html',
  styleUrl: './categoria-form.scss',
})
export class CategoriaForm {
  private readonly fb = inject(FormBuilder);

  readonly categoria = input<Categoria | null>(null);

  readonly salvar = output<CategoriaRequest>();
  readonly cancelar = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(80)]],
    descricao: ['', [Validators.maxLength(255)]],
  });

  constructor() {
    effect(() => {
      const categoria = this.categoria();
      this.form.reset({
        nome: categoria?.nome ?? '',
        descricao: categoria?.descricao ?? '',
      });
    });
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nome, descricao } = this.form.getRawValue();
    this.salvar.emit({ nome, descricao: descricao || null });
    this.form.reset();
  }

  protected get nomeInvalido(): boolean {
    const controle = this.form.controls.nome;
    return controle.invalid && controle.touched;
  }
}
