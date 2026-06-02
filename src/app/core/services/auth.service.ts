import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly tokenKey = 'jwt_token';
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Login/postLogin`;

  login(credentials: any): Observable<string> {
    return this.http.post<any>(this.apiUrl, credentials).pipe(
      map((response) => response?.token ?? response?.Token ?? ''),
      tap((token) => { if (token) this.setToken(token); })
    );
  }

  getToken(): string | null { return localStorage.getItem(this.tokenKey); }
  setToken(token: string): void { localStorage.setItem(this.tokenKey, token); }
  logout(): void { localStorage.removeItem(this.tokenKey); }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      if (!exp) return false;
      return Date.now() < exp * 1000;
    } catch {
      return false;
    }
  }
}
