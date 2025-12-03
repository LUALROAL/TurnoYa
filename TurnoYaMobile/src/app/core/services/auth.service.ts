import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { UserRole } from '../models';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = environment.apiUrl;
  private tokenKey = environment.tokenKey;
  private refreshTokenKey = environment.refreshTokenKey;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.loadStoredUser();
  }

  /**
   * Cargar usuario almacenado al iniciar la app
   */
  private async loadStoredUser(): Promise<void> {
    const token = await this.storageService.get(this.tokenKey);
    if (token) {
      // Decodificar token y extraer usuario (simplificado)
      // En producción, deberías validar el token primero
      try {
        const user = await this.storageService.get('current_user');
        if (user) {
          this.currentUserSubject.next(user);
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
      }
    }
  }

  /**
   * Registrar nuevo usuario
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/register`, data)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  /**
   * Iniciar sesión
   */
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/login`, data)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    await this.storageService.remove(this.tokenKey);
    await this.storageService.remove(this.refreshTokenKey);
    await this.storageService.remove('current_user');
    this.currentUserSubject.next(null);
  }

  /**
   * Refrescar token
   */
  refreshToken(): Observable<AuthResponse> {
    return from(this.getRefreshTokenFromStorage()).pipe(
      switchMap(tokens => {
        if (!tokens.token || !tokens.refreshToken) {
          throw new Error('No refresh token available');
        }

        const request: RefreshTokenRequest = {
          token: tokens.token,
          refreshToken: tokens.refreshToken
        };

        return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/refresh`, request);
      }),
      tap(response => this.handleAuthResponse(response))
    );
  }

  /**
   * Verificar si el usuario está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.storageService.get(this.tokenKey);
    return !!token;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Obtener token actual
   */
  async getToken(): Promise<string | null> {
    return await this.storageService.get(this.tokenKey);
  }

  /**
   * Guardar token
   */
  async saveToken(token: string): Promise<void> {
    await this.storageService.set(this.tokenKey, token);
  }

  /**
   * Guardar refresh token
   */
  async saveRefreshToken(refreshToken: string): Promise<void> {
    await this.storageService.set(this.refreshTokenKey, refreshToken);
  }

  /**
   * Manejar respuesta de autenticación
   */
  private async handleAuthResponse(response: AuthResponse): Promise<void> {
    await this.saveToken(response.token);
    await this.saveRefreshToken(response.refreshToken);
    await this.storageService.set('current_user', response.user);
    this.currentUserSubject.next(response.user);
  }

  /**
   * Obtener refresh token del storage
   */
  private async getRefreshTokenFromStorage(): Promise<{ token: string | null, refreshToken: string | null }> {
    const token = await this.storageService.get(this.tokenKey);
    const refreshToken = await this.storageService.get(this.refreshTokenKey);
    return { token, refreshToken };
  }

  /**
   * Revocar token (opcional)
   */
  revokeToken(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/Auth/revoke/${userId}`, {});
  }

  /**
   * Helpers de roles
   */
  isCustomer(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === UserRole.Customer;
  }

  isBusinessOwner(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === UserRole.BusinessOwner;
  }

  isEmployee(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === UserRole.Employee;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === UserRole.Admin;
  }

  getCurrentUserRole(): UserRole | null {
    return this.currentUserSubject.value?.role || null;
  }

  /**
   * Cambiar rol del usuario (solo Customer <-> BusinessOwner permitido)
   */
  async switchRole(newRole: UserRole): Promise<void> {
    const user = this.currentUserSubject.value;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    // Solo permitir cambio entre Customer y BusinessOwner
    if (!((user.role === UserRole.Customer && newRole === UserRole.BusinessOwner) ||
        (user.role === UserRole.BusinessOwner && newRole === UserRole.Customer))) {
      throw new Error('Solo se permite cambiar entre Cliente y Dueño de Negocio');
    }

    try {
      // Llamar al backend para persistir el cambio
      await this.http.patch(`${this.apiUrl}/users/${user.id}/role`, { role: newRole }).toPromise();

      // Actualizar localmente
      user.role = newRole;
      await this.storageService.set('current_user', user);
      this.currentUserSubject.next(user);
    } catch (error) {
      throw new Error('Error al cambiar el rol en el servidor');
    }
  }
}
