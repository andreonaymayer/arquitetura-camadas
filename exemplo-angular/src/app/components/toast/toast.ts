import { Component, inject } from '@angular/core';
import { NotificacaoService } from '../../core/notificacao.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  protected readonly notificacao = inject(NotificacaoService);
}
