export interface Categoria {
  id: number;
  nome: string;
  descricao: string | null;
}

export interface CategoriaRequest {
  nome: string;
  descricao: string | null;
}
