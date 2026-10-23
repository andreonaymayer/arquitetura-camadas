import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'produtos' },
  {
    path: 'produtos',
    title: 'Produtos',
    loadComponent: () => import('./pages/produtos-lista/produtos-lista').then((m) => m.ProdutosLista),
  },
  {
    path: 'buscar',
    title: 'Buscar por categoria',
    loadComponent: () => import('./pages/produtos-busca/produtos-busca').then((m) => m.ProdutosBusca),
  },
  {
    path: 'novo/produto',
    title: 'Novo produto',
    loadComponent: () => import('./pages/produto-novo/produto-novo').then((m) => m.ProdutoNovo),
  },
  {
    path: 'editar/produto/:id',
    title: 'Editar produto',
    loadComponent: () => import('./pages/produto-editar/produto-editar').then((m) => m.ProdutoEditar),
  },
  {
    path: 'categorias',
    title: 'Categorias',
    loadComponent: () => import('./pages/categorias/categorias').then((m) => m.Categorias),
  },
  {
    path: '**',
    title: 'Página não encontrada',
    loadComponent: () =>
      import('./pages/nao-encontrada/nao-encontrada').then((m) => m.NaoEncontrada),
  },
];
