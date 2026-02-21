import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

/**
 * Guard funcional para proteger rutas que requieren rol de Administrador.
 *
 * Verifica si existe un token válido Y si el usuario tiene rol "Admin".
 * Si no está autenticado, redirige al login.
 * Si está autenticado pero no es Admin, redirige al home.
 *
 * @example
 * // En las rutas:
 * {
 *   path: 'admin/users',
 *   component: AdminUsersPage,
 *   canActivate: [adminGuard]
 * }
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const sessionService = inject(AuthSessionService);
  const router = inject(Router);

  const hasValidSession = sessionService.hasValidSession();

  // Si no hay sesión válida, redirigir a login
  if (!hasValidSession) {
    sessionService.clearSession();
    const returnUrl = state.url;
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl },
    });
    return false;
  }

  // Verificar si el usuario tiene rol de Admin
  const session = sessionService.getSession();
  const isAdmin = session?.user?.role === 'Admin';

  if (!isAdmin) {
    // Usuario autenticado pero no es Admin, redirigir a home
    router.navigate(['/home']);
    return false;
  }

  return true;
};
