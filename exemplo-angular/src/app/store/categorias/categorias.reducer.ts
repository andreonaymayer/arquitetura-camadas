import { createFeature, createReducer, on } from '@ngrx/store';
import { Categoria } from '../../models/categoria';
import { CategoriasActions } from './categorias.actions';

export interface CategoriasState {
  itens: Categoria[];
  carregando: boolean;
  carregado: boolean;
}

const estadoInicial: CategoriasState = {
  itens: [],
  carregando: false,
  carregado: false,
};

export const categoriasFeature = createFeature({
  name: 'categorias',
  reducer: createReducer(
    estadoInicial,
    on(CategoriasActions.carregar, (estado) =>
      estado.carregado ? estado : { ...estado, carregando: true },
    ),
    on(CategoriasActions.carregarSucesso, (estado, { categorias }) => ({
      ...estado,
      itens: categorias,
      carregando: false,
      carregado: true,
    })),
    on(CategoriasActions.carregarFalha, (estado) => ({ ...estado, carregando: false })),
    on(CategoriasActions.criarSucesso, (estado, { categoria }) => ({
      ...estado,
      itens: [...estado.itens, categoria],
    })),
    on(CategoriasActions.atualizarSucesso, (estado, { categoria }) => ({
      ...estado,
      itens: estado.itens.map((item) => (item.id === categoria.id ? categoria : item)),
    })),
    on(CategoriasActions.removerSucesso, (estado, { id }) => ({
      ...estado,
      itens: estado.itens.filter((item) => item.id !== id),
    })),
  ),
});
