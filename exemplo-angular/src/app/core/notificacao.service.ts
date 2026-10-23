import { Injectable, signal } from '@angular/core';

export interface Notificacao {
  tipo: 'sucesso' | 'erro';
  texto: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  readonly atual = signal<Notificacao | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;

  sucesso(texto: string): void {
    this.mostrar({ tipo: 'sucesso', texto });
  }

  erro(texto: string): void {
    this.mostrar({ tipo: 'erro', texto });
  }

  fechar(): void {
    this.atual.set(null);
  }

  private mostrar(notificacao: Notificacao): void {
    clearTimeout(this.temporizador);
    this.atual.set(notificacao);
    this.temporizador = setTimeout(() => this.fechar(), 5000);
  }
}
