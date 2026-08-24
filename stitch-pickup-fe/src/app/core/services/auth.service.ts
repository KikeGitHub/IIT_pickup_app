import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthUserModel, UserRole } from '../auth/models/auth-user.model';
import { JwtPayloadModel } from '../auth/models/jwt-payload.model';
import { environment } from '../../../environments/environment';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  userId: string;
  nombre: string;
  role: UserRole;
  studentIds?: string[];
  level?: string;
  groups?: string[];
  tempPassword?: boolean;
}

const TOKEN_KEY = 'sp_jwt';
const USER_KEY = 'sp_user';

/**
 * AuthService — Manages authentication state for all user roles.
 *
 * Uses Angular signals for reactive state management.
 * Stores JWT in localStorage (acceptable for this use case — see ADR-002).
 *
 * SOLID: Single Responsibility — only handles auth state.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiBaseUrl;

  // ─── Reactive State (Angular Signals) ───────────────────────────────────────
  private _currentUser = signal<AuthUserModel | null>(this.loadUserFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  readonly requiresPasswordChange = computed(
    () => this._currentUser()?.tempPassword === true
  );

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  loginParent(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/auth/parent/login`, { email, password } as LoginRequest)
      .pipe(
        tap((res) => this.handleLoginSuccess(res)),
        catchError((err) => throwError(() => err))
      );
  }

  loginTeacher(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/auth/teacher/login`, { email, password } as LoginRequest)
      .pipe(
        tap((res) => this.handleLoginSuccess(res)),
        catchError((err) => throwError(() => err))
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.api}/auth/change-password`, { currentPassword, newPassword })
      .pipe(
        tap(() => {
          const user = this._currentUser();
          if (user) {
            const updatedUser = { ...user, tempPassword: false };
            this._currentUser.set(updatedUser);
            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      // Check expiration
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private handleLoginSuccess(res: LoginResponse): void {
    const user: AuthUserModel = {
      userId: res.userId,
      email: '',           // Not always returned; decoded from token
      nombre: res.nombre,
      role: res.role,
      token: res.token,
      studentIds: res.studentIds,
      level: res.level,
      groups: res.groups,
      tempPassword: res.tempPassword ?? false,
    };

    // Enrich from token payload
    try {
      const payload = this.decodeToken(res.token);
      user.email = payload.sub;
    } catch { /* keep empty */ }

    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private loadUserFromStorage(): AuthUserModel | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw) as AuthUserModel;
      // Validate token is still valid
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      const payload = this.decodeToken(token);
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  private decodeToken(token: string): JwtPayloadModel {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload) as JwtPayloadModel;
  }
}
