import { Injectable } from "@angular/core";
import { AuthSession } from "../models/auth-session.model";

@Injectable({
  providedIn: "root",
})
export class AuthSessionService {
  private readonly storageKey = "turnoya.session";

  getSession(): AuthSession | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.getSession()?.accessToken ?? null;
  }

  isAccessTokenExpired(): boolean {
    const session = this.getSession();
    if (!session?.accessToken || !session.expiresAt) {
      return true;
    }

    const expiresAt = new Date(session.expiresAt).getTime();
    if (Number.isNaN(expiresAt)) {
      return true;
    }

    return Date.now() >= expiresAt;
  }

  hasValidSession(): boolean {
    return !this.isAccessTokenExpired();
  }

  setSession(session: AuthSession) {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  clearSession() {
    localStorage.removeItem(this.storageKey);
  }
}
