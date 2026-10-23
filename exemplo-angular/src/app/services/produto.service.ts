import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Produto, ProdutoBusca, ProdutoRequest } from '../models/produto';

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/produtos';

  listar(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.url);
  }

  buscarPorId(id: number): Observable<Produto> {
    return this.http.get<Produto>(`${this.url}/${id}`);
  }

  buscarPorCodigo(codigo: string): Observable<Produto> {
    return this.http.get<Produto>(`${this.url}/codigo/${encodeURIComponent(codigo)}`);
  }

  buscarPorCategoriaEFaixaDePreco(
    categoria: string,
    precoMin: number,
    precoMax: number,
  ): Observable<ProdutoBusca[]> {
    const params = new HttpParams()
      .set('categoria', categoria)
      .set('precoMin', precoMin)
      .set('precoMax', precoMax);
    return this.http.get<ProdutoBusca[]>(`${this.url}/busca`, { params });
  }

  criar(request: ProdutoRequest): Observable<Produto> {
    return this.http.post<Produto>(this.url, request);
  }

  atualizar(id: number, request: ProdutoRequest): Observable<Produto> {
    return this.http.put<Produto>(`${this.url}/${id}`, request);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
