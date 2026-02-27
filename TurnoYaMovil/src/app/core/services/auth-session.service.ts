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
   * Carga la sesión desde localStorage (solo se usa internamente)
   */
  private loadSession(): AuthSession | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
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
   * Guarda la sesión en localStorage y emite el nuevo valor
   */
  setSession(session: AuthSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  /**
   * Elimina la sesión y emite null
   */
  clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.sessionSubject.next(null);
  }
}
