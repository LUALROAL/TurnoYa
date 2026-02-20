import { inject } from "@angular/core";
import { HttpInterceptorFn } from "@angular/common/http";

import { isPublicEndpoint } from "../constants/public-endpoints.constant";
import { AuthSessionService } from "../services/auth-session.service";

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
