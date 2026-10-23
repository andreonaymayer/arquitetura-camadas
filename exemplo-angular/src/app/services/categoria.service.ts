import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Categoria, CategoriaRequest } from '../models/categoria';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/categorias';

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.url);
  }

  criar(request: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.url, request);
  }

  atualizar(id: number, request: CategoriaRequest): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.url}/${id}`, request);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
