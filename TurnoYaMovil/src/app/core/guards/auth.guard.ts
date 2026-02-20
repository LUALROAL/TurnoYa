import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

/**
 * Guard funcional para proteger rutas que requieren autenticación.
 *
 * Verifica si existe un token válido en la sesión.
 * Si no existe, redirige al usuario a la página de login.
 *
 * @example
 * // En las rutas:
 * {
 *   path: 'home',
 *   component: HomePage,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const sessionService = inject(AuthSessionService);
  const router = inject(Router);

  const token = sessionService.getAccessToken();

  if (!token) {
    // Guardar la URL solicitada para redirigir después del login
    const returnUrl = state.url;
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl },
    });
    return false;
  }

  return true;
};
