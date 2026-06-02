import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Base HTTP service. All methods return Observable<any> on purpose to avoid
 * maintaining duplicate type definitions between backend DTOs and frontend models.
 * Consumers should access fields safely (e.g. res?.data?.someField).
 */
@Injectable({ providedIn: 'root' })
export class BaseService {
  protected http = inject(HttpClient);
  protected readonly baseUrl = `${environment.apiBaseUrl}/api`;

  protected get(endpoint: string, params?: HttpParams): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${endpoint}`, { params });
  }

  protected post(endpoint: string, body: unknown): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${endpoint}`, body);
  }

  protected put(endpoint: string, body: unknown): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${endpoint}`, body);
  }

  protected delete(endpoint: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${endpoint}`);
  }
}
