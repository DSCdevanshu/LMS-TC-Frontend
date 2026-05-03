import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginApiResponse, LoginRequest } from '../../data/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly tokenKey = 'jwt_token';
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Login/postLogin`;

  login(credentials: LoginRequest): Observable<string> {
    return this.http.post<LoginApiResponse>(this.apiUrl, credentials).pipe(
      map((response) => response.token ?? response.Token ?? ''),
      tap((token) => {
        if (token) {
          this.setToken(token);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
