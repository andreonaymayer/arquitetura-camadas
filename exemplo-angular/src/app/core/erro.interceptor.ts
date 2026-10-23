import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificacaoService } from './notificacao.service';

function mensagemDe(erro: HttpErrorResponse): string {
  if (erro.status === 0) {
    return 'Não foi possível falar com a API. Ela está rodando em localhost:8080?';
  }
  if (erro.status === 400 && !erro.error?.message) {
    return 'Dados inválidos. Confira os campos do formulário.';
  }
  return erro.error?.message ?? `Erro ${erro.status}`;
}

export const erroInterceptor: HttpInterceptorFn = (req, next) => {
  const notificacao = inject(NotificacaoService);
  return next(req).pipe(
    catchError((erro: HttpErrorResponse) => {
      notificacao.erro(mensagemDe(erro));
      return throwError(() => erro);
    }),
  );
};
