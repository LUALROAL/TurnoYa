import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';
import { UserRole } from '../models';

/**
 * Guard para verificar roles específicos
 * Uso: canActivate: [roleGuard(['BusinessOwner', 'Admin'])]
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.getCurrentUser().pipe(
      map(user => {
        if (!user) {
          router.navigate(['/login']);
          return false;
        }

        if (!allowedRoles.includes(user.role)) {
          // Redirigir a página de "no autorizado" o home
          router.navigate(['/home']);
          return false;
        }

        return true;
      })
    );
  };
};
