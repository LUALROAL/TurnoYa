import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirigir al login si no está autenticado
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Verificar si el usuario tiene rol de administrador
  if (!authService.isAdmin()) {
    // Redirigir a la página principal si no es admin
    router.navigate(['/home']);
    return false;
  }

  return true;
};
