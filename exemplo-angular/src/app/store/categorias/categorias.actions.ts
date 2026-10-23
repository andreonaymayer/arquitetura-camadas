import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Categoria, CategoriaRequest } from '../../models/categoria';

export const CategoriasActions = createActionGroup({
  source: 'Categorias',
  events: {
    Carregar: emptyProps(),
    'Carregar Sucesso': props<{ categorias: Categoria[] }>(),
    'Carregar Falha': emptyProps(),
    Criar: props<{ request: CategoriaRequest }>(),
    'Criar Sucesso': props<{ categoria: Categoria }>(),
    Atualizar: props<{ id: number; request: CategoriaRequest }>(),
    'Atualizar Sucesso': props<{ categoria: Categoria }>(),
    Remover: props<{ id: number }>(),
    'Remover Sucesso': props<{ id: number }>(),
    'Operacao Falha': emptyProps(),
  },
});
