import { inject } from "@angular/core";
import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

import { AuthSessionService } from "../services/auth-session.service";
import { NotifyService } from "../services/notify.service";

function resolveErrorMessage(error: HttpErrorResponse) {
  if (typeof error.error === "string") {
    return error.error;
  }

  if (error.error?.message) {
    return error.error.message as string;
  }

  return "Ocurrio un error inesperado.";
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotifyService);
  const session = inject(AuthSessionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;
      const message = resolveErrorMessage(error);

      if (status === 0) {
        void notify.showError("No se pudo conectar con el servidor.");
      } else if (status === 400) {
        void notify.showError(message);
      } else if (status === 401) {
        session.clearSession();
        void notify.showError("Sesion expirada. Inicia sesion de nuevo.");
        void router.navigateByUrl("/auth/login");
      } else if (status === 403) {
        void notify.showError("No tienes permisos para esta accion.");
      } else if (status >= 500) {
        void notify.showError("Error del servidor. Intentalo mas tarde.");
      } else {
        void notify.showError(message);
      }

      return throwError(() => error);
    })
  );
};
