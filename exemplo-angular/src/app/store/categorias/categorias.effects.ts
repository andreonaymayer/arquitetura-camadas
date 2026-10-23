import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, filter, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { NotificacaoService } from '../../core/notificacao.service';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriasActions } from './categorias.actions';
import { categoriasFeature } from './categorias.reducer';

export const carregarCategorias = createEffect(
  (
    actions$ = inject(Actions),
    categoriaService = inject(CategoriaService),
    store = inject(Store),
  ) =>
    actions$.pipe(
      ofType(CategoriasActions.carregar),
      withLatestFrom(store.select(categoriasFeature.selectCarregado)),
      filter(([, carregado]) => !carregado),
      switchMap(() =>
        categoriaService.listar().pipe(
          map((categorias) => CategoriasActions.carregarSucesso({ categorias })),
          catchError(() => of(CategoriasActions.carregarFalha())),
        ),
      ),
    ),
  { functional: true },
);

export const criarCategoria = createEffect(
  (actions$ = inject(Actions), categoriaService = inject(CategoriaService)) =>
    actions$.pipe(
      ofType(CategoriasActions.criar),
      exhaustMap(({ request }) =>
        categoriaService.criar(request).pipe(
          map((categoria) => CategoriasActions.criarSucesso({ categoria })),
          catchError(() => of(CategoriasActions.operacaoFalha())),
        ),
      ),
    ),
  { functional: true },
);

export const atualizarCategoria = createEffect(
  (actions$ = inject(Actions), categoriaService = inject(CategoriaService)) =>
    actions$.pipe(
      ofType(CategoriasActions.atualizar),
      exhaustMap(({ id, request }) =>
        categoriaService.atualizar(id, request).pipe(
          map((categoria) => CategoriasActions.atualizarSucesso({ categoria })),
          catchError(() => of(CategoriasActions.operacaoFalha())),
        ),
      ),
    ),
  { functional: true },
);

export const removerCategoria = createEffect(
  (actions$ = inject(Actions), categoriaService = inject(CategoriaService)) =>
    actions$.pipe(
      ofType(CategoriasActions.remover),
      exhaustMap(({ id }) =>
        categoriaService.remover(id).pipe(
          map(() => CategoriasActions.removerSucesso({ id })),
          catchError(() => of(CategoriasActions.operacaoFalha())),
        ),
      ),
    ),
  { functional: true },
);

function avisarQuando(
  acao:
    | typeof CategoriasActions.criarSucesso
    | typeof CategoriasActions.atualizarSucesso
    | typeof CategoriasActions.removerSucesso,
  texto: string,
) {
  return createEffect(
    (actions$ = inject(Actions), notificacao = inject(NotificacaoService)) =>
      actions$.pipe(
        ofType(acao),
        tap(() => notificacao.sucesso(texto)),
      ),
    { functional: true, dispatch: false },
  );
}

export const avisarCriada = avisarQuando(CategoriasActions.criarSucesso, 'Categoria criada');
export const avisarAtualizada = avisarQuando(
  CategoriasActions.atualizarSucesso,
  'Categoria atualizada',
);
export const avisarRemovida = avisarQuando(CategoriasActions.removerSucesso, 'Categoria removida');
