import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Error del lado del servidor
        switch (error.status) {
          case 400:
            errorMessage = 'Solicitud inválida. Por favor verifica los datos.';
            if (error.error?.errors) {
              // Manejar errores de validación de FluentValidation
              const validationErrors = Object.values(error.error.errors)
                .reduce((acc: string[], curr) => acc.concat(curr as string[]), []);
              errorMessage = validationErrors.join('\n');
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }
            break;
          case 401:
            errorMessage = 'No autorizado. Por favor inicia sesión nuevamente.';
            // Redirigir al login
            router.navigate(['/login']);
            break;
          case 403:
            errorMessage = 'No tienes permisos para realizar esta acción.';
            break;
          case 404:
            errorMessage = 'Recurso no encontrado.';
            break;
          case 500:
            errorMessage = 'Error del servidor. Por favor intenta más tarde.';
            break;
          default:
            errorMessage = `Error: ${error.status} - ${error.message}`;
        }
      }

      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        error: error.error
      });

      // Puedes agregar aquí un servicio de toast/alert para mostrar el error al usuario
      return throwError(() => new Error(errorMessage));
    })
  );
};
