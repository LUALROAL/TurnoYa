import { Injectable } from "@angular/core";
import { finalize, Observable, shareReplay, tap, throwError } from "rxjs";
import { Capacitor } from "@capacitor/core";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";

import { ApiService } from "../../../core/services/api.service";
import { AuthSessionService } from "../../../core/services/auth-session.service";
import {
  AuthResponseDto,
  GoogleLoginRequestDto,
  LinkGoogleRequestDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
} from "../models";

// Client ID de Google - actualizado para web y móvil
const GOOGLE_CLIENT_ID = "504093820497-06quvb9dkvfkfn9ts06256id729gcjt4.apps.googleusercontent.com";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private refreshInFlight$?: Observable<AuthResponseDto>;
  private googleInitialized = false;
  private googleClient: any = null; // Para web
  private pendingGoogleCredential: string | null = null; // Para web - guarda el JWT del One Tap

  constructor(
    private readonly api: ApiService,
    private readonly session: AuthSessionService
  ) {}

  /**
   * Detecta si estamos en web o nativo
   */
  private isWeb(): boolean {
    return Capacitor.getPlatform() === "web";
  }

  /**
   * Inicializa Google Sign-In según la plataforma
   */
  private async initializeGoogleSignIn(): Promise<void> {
    if (this.googleInitialized) {
      return;
    }

    if (this.isWeb()) {
      await this.initializeWebGoogleSignIn();
    } else {
      await this.initializeNativeGoogleSignIn();
    }
    
    this.googleInitialized = true;
  }

  /**
   * Inicializa Google Sign-In para nativo (Android/iOS)
   */
  private async initializeNativeGoogleSignIn(): Promise<void> {
    try {
      await GoogleSignIn.initialize({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ["profile", "email"],
      });
      console.log("Google Sign-In (native) initialized successfully");
    } catch (error) {
      console.error("Error initializing Google Sign-In (native):", error);
      throw new Error("No se pudo inicializar Google Sign-In");
    }
  }

  /**
   * Inicializa Google Sign-In para web usando Google Identity Services (One Tap)
   * Este flujo devuelve el JWT (id_token) directamente
   */
  private async initializeWebGoogleSignIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar que el script de Google esté disponible
      if (!(window as any).google?.accounts?.id) {
        reject(new Error("Google Identity Services no está disponible. Asegúrate de cargar el script de g_id_onload"));
        return;
      }

      try {
        // Configurar el cliente de Google Identity Services para web
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            // Este callback recibe el JWT (credential) directamente
            console.log("Google One Tap callback:", response);
            // Guardar la respuesta para que performWebGoogleSignIn la use
            this.pendingGoogleCredential = response.credential;
          },
          auto_select: false,
          cancel_on_tap_outside: false,
        });

        console.log("Google Sign-In (web) initialized successfully");
        this.googleInitialized = true;
        resolve();
      } catch (error) {
        console.error("Error initializing Google Sign-In (web):", error);
        reject(error);
      }
    });
  }

  /**
   * Realiza el login con Google según la plataforma
   */
  private async performGoogleSignIn(): Promise<GoogleLoginResult> {
    if (this.isWeb()) {
      return this.performWebGoogleSignIn();
    } else {
      return this.performNativeGoogleSignIn();
    }
  }

  /**
   * Login con Google en nativo
   */
  private async performNativeGoogleSignIn(): Promise<GoogleLoginResult> {
    const result = await GoogleSignIn.signIn();
    
    if (!result.idToken) {
      throw new Error("No se pudo obtener el token de autenticación de Google");
    }

    return {
      idToken: result.idToken,
      fullName: result.displayName || undefined,
      givenName: result.givenName || undefined,
      familyName: result.familyName || undefined,
      imageUrl: result.imageUrl || undefined,
    };
  }

  /**
   * Login con Google en web usando el flujo de credentials
   * Este flujo es más confiable para desarrollo local
   */
  private performWebGoogleSignIn(): Promise<GoogleLoginResult> {
    return new Promise((resolve, reject) => {
      // Verificar que Google Identity Services esté disponible
      if (!(window as any).google?.accounts?.id) {
        console.error("Google Identity Services no disponible");
        reject(new Error("Google Sign-In no está disponible. Recarga la página e intenta nuevamente."));
        return;
      }

      // Resetear el credential previo
      this.pendingGoogleCredential = null;

      // Usar el flujo de renderButton que es más confiable
      // Creamos un elemento temporal para el botón de Google
      const container = document.createElement('div');
      container.style.display = 'none';
      document.body.appendChild(container);

      try {
        (window as any).google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          logo_alignment: 'left'
        });

        // Programáticamente hacer click en el botón generado
        const button = container.querySelector('div[role="button"]') as HTMLElement;
        if (button) {
          button.click();
        } else {
          // Si no encontramos el botón, intentar mostrar el popup directamente
          (window as any).google.accounts.id.prompt();
        }
      } catch (error) {
        console.error("Error rendering Google button:", error);
        // Como fallback, intentar el popup
        try {
          (window as any).google.accounts.id.prompt();
        } catch (e) {
          console.error("Error showing Google prompt:", e);
        }
      }

      // Monitorear el credential con un intervalo
      let attempts = 0;
      const maxAttempts = 100; // ~10 segundos max

      const checkCredential = () => {
        attempts++;
        
        if (this.pendingGoogleCredential) {
          // Encontramos el credential, decodificar y resolver
          const payload = this.decodeGoogleJwt(this.pendingGoogleCredential);
          document.body.removeChild(container);
          
          resolve({
            idToken: this.pendingGoogleCredential,
            fullName: payload.name || undefined,
            givenName: payload.given_name || undefined,
            familyName: payload.family_name || undefined,
            imageUrl: payload.picture || undefined,
          });
          return;
        }

        // El usuario no completó el login o hubo un error, verificar si hay un momentoskipped o dismissed
        // Nota: El callback ya manejó estos casos, pero si llegamos aquí después de mucho tiempo,
        // probablemente el usuario cerró la ventana sin completar
        if (attempts >= maxAttempts) {
          document.body.removeChild(container);
          reject(new Error("Tiempo de espera agotado. Intenta nuevamente."));
          return;
        }

        // Continuar monitoreando
        setTimeout(checkCredential, 100);
      };

      // Iniciar el monitoreo después de un pequeño delay
      setTimeout(checkCredential, 500);
    });
  }

  /**
   * Decodifica un JWT de Google para obtener el payload
   */
  private decodeGoogleJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return {};
    }
  }

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

  async googleLogin(): Promise<Observable<AuthResponseDto>> {
    try {
      // Inicializar Google Sign-In según la plataforma
      await this.initializeGoogleSignIn();

      // Realizar el login
      const result = await this.performGoogleSignIn();

      const payload: GoogleLoginRequestDto = {
        idToken: result.idToken,
        fullName: result.fullName,
        givenName: result.givenName,
        familyName: result.familyName,
        imageUrl: result.imageUrl,
      };

      // Enviar al backend
      return this.api.post<AuthResponseDto>("/api/auth/google", payload).pipe(
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
    } catch (error: any) {
      if (error?.message?.includes("Cancelled") || error?.message?.includes("cancelado")) {
        throw new Error("Inicio de sesión cancelado");
      }
      throw error;
    }
  }

  async linkGoogle(): Promise<Observable<void>> {
    try {
      // Inicializar Google Sign-In según la plataforma
      await this.initializeGoogleSignIn();

      // Realizar el login
      const result = await this.performGoogleSignIn();

      const payload: LinkGoogleRequestDto = {
        idToken: result.idToken,
      };

      // Enviar al backend para vincular cuenta
      return this.api.post<void>("/api/auth/link-google", payload);
    } catch (error: any) {
      if (error?.message?.includes("Cancelled") || error?.message?.includes("cancelado")) {
        throw new Error("Vinculación cancelada");
      }
      throw error;
    }
  }
}

/**
 * Interface para el resultado de Google Sign-In
 */
interface GoogleLoginResult {
  idToken: string;
  fullName?: string;
  givenName?: string;
  familyName?: string;
  imageUrl?: string;
}