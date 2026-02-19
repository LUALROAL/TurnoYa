import { inject } from "@angular/core";
import { HttpInterceptorFn } from "@angular/common/http";

import { AuthSessionService } from "../services/auth-session.service";

const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/payments/webhook"];

function isPublicEndpoint(url: string) {
  return PUBLIC_PATHS.some(path => url.includes(path));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  const session = inject(AuthSessionService);
  const token = session.getAccessToken();

  if (!token) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  }));
};
