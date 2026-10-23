export interface ProdutoBusca {
  id: number;
  codigo: string;
  nome: string;
  preco: number;
  categoriaNome: string;
}

export interface Produto extends ProdutoBusca {
  categoriaId: number;
}

export interface ProdutoRequest {
  codigo: string;
  nome: string;
  preco: number;
  categoriaId: number;
}
