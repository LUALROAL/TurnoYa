import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  console.log('🔐 authGuard ejecutándose...');
  console.log('📍 Route:', state.url);

  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isAuthenticated();
  console.log('✅ isAuthenticated:', isAuthenticated);

  if (!isAuthenticated) {
    console.log('❌ No autenticado, redirigiendo a /login');
    // Redirigir al login si no está autenticado
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  console.log('✅ Autenticado, permitiendo acceso a:', state.url);
  return true;
};
