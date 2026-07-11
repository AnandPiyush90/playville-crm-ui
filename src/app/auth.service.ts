import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  username: string;
  role: string;
  branchId: number;
  branchCode: string;
  branchName?: string;
  token: string;
  expiresInMs: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = '/api/v1';
  private readonly tokenKey = 'playville_auth_token';
  private readonly userKey = 'playville_auth_user';

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/auth/login`, payload).pipe(
      map((response) => response.data),
      tap((response) => {
        if (response?.token) {
          localStorage.setItem(this.tokenKey, response.token);
          try {
            localStorage.setItem(this.userKey, JSON.stringify(response));
          } catch {}
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }

  getBranchId(): number | null {
    const u = this.getUser();
    return u?.branchId ?? null;
  }
}
