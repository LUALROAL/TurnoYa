import { Injectable } from "@angular/core";
import { finalize, Observable, shareReplay, tap, throwError } from "rxjs";

import { ApiService } from "../../../core/services/api.service";
import { AuthSessionService } from "../../../core/services/auth-session.service";
import {
  AuthResponseDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
} from "../models";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private refreshInFlight$?: Observable<AuthResponseDto>;

  constructor(
    private readonly api: ApiService,
    private readonly session: AuthSessionService
  ) {}

  login(email: string, password: string): Observable<AuthResponseDto> {
    const payload: LoginRequestDto = {
      email,
      password,
    };

    return this.api.post<AuthResponseDto>("/api/auth/login", payload).pipe(
      tap(response => {
        this.session.setSession({
          accessToken: response.token,
          refreshToken: response.refreshToken,
          expiresAt: new Date(Date.now() + response.expiresIn * 1000).toISOString(),
          user: {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            role: response.user.role,
          },
        });
      })
    );
  }

  register(fullName: string, email: string, password: string): Observable<AuthResponseDto> {
    const [firstName, ...lastNameParts] = fullName.trim().split(" ").filter(Boolean);
    const lastName = lastNameParts.join(" ").trim();

    const payload: RegisterRequestDto = {
      email,
      password,
      confirmPassword: password,
      firstName: firstName ?? "Usuario",
      lastName: lastName || "TurnoYa",
      role: "Customer",
    };

    return this.api.post<AuthResponseDto>("/api/auth/register", payload);
  }

  refreshToken(): Observable<AuthResponseDto> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const currentSession = this.session.getSession();
    if (!currentSession?.refreshToken || !currentSession.accessToken) {
      return throwError(() => new Error("No hay refresh token disponible."));
    }

    const payload: RefreshTokenRequestDto = {
      token: currentSession.accessToken,
      refreshToken: currentSession.refreshToken,
    };

    this.refreshInFlight$ = this.api.post<AuthResponseDto>("/api/auth/refresh", payload).pipe(
      tap(response => {
        this.session.setSession({
          accessToken: response.token,
          refreshToken: response.refreshToken,
          expiresAt: new Date(Date.now() + response.expiresIn * 1000).toISOString(),
          user: {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            role: response.user.role,
          },
        });
      }),
      finalize(() => {
        this.refreshInFlight$ = undefined;
      }),
      shareReplay(1)
    );

    return this.refreshInFlight$;
  }
}
