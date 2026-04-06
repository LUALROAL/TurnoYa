import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthSession } from '../models/auth-session.model';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly storageKey = 'turnoya.session';

  // Subject privado que almacena el estado actual de la sesión
  private sessionSubject = new BehaviorSubject<AuthSession | null>(this.loadSession());

  // Observable público al que los componentes pueden suscribirse
  session$: Observable<AuthSession | null> = this.sessionSubject.asObservable();

  constructor() {}

  /**
   * Carga la sesión desde localStorage o sessionStorage (solo se usa internamente)
   * Busca primero en sessionStorage (sesión actual), luego en localStorage (rememberMe)
   */
  private loadSession(): AuthSession | null {
    // Primero buscar en sessionStorage (sesión sin rememberMe)
    let raw = sessionStorage.getItem(this.storageKey);
    if (raw) {
      try {
        const session = JSON.parse(raw) as AuthSession;
        // Verificar que el token no esté expirado
        if (!this.isSessionExpired(session)) {
          return session;
        }
      } catch {
        // Continuar buscando en localStorage
      }
    }

    // Luego buscar en localStorage (sesión con rememberMe)
    raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    
    try {
      const session = JSON.parse(raw) as AuthSession;
      // Verificar que el token no esté expirado
      if (!this.isSessionExpired(session)) {
        return session;
      }
      // Si expiró, limpiar ambos storages
      this.clearSession();
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Verifica si una sesión específica está expirada
   */
  private isSessionExpired(session: AuthSession): boolean {
    if (!session?.accessToken || !session.expiresAt) return true;

    const expiresAt = new Date(session.expiresAt).getTime();
    if (Number.isNaN(expiresAt)) return true;

    return Date.now() >= expiresAt;
  }

  /**
   * Obtiene la sesión actual (valor inmediato)
   */
  getSession(): AuthSession | null {
    return this.sessionSubject.value;
  }

  /**
   * Obtiene el token de acceso
   */
  getAccessToken(): string | null {
    return this.getSession()?.accessToken ?? null;
  }

  /**
   * Verifica si el token ha expirado
   */
  isAccessTokenExpired(): boolean {
    const session = this.getSession();
    if (!session?.accessToken || !session.expiresAt) return true;

    const expiresAt = new Date(session.expiresAt).getTime();
    if (Number.isNaN(expiresAt)) return true;

    return Date.now() >= expiresAt;
  }

  /**
   * Verifica si hay una sesión válida
   */
  hasValidSession(): boolean {
    return !this.isAccessTokenExpired();
  }

  /**
   * Guarda la sesión en storage según el flag rememberMe
   * @param session - Datos de la sesión
   * @param rememberMe - Si true, usa localStorage (persiste entre sesiones)
   *                     Si false, usa sessionStorage (se limpia al cerrar navegador)
   */
  setSession(session: AuthSession, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.storageKey, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  /**
   * Elimina la sesión de ambos storages y emite null
   */
  clearSession(): void {
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);
    this.sessionSubject.next(null);
  }
}
