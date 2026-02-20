export const PUBLIC_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/payments/webhook",
] as const;

export function isPublicEndpoint(url: string) {
  return PUBLIC_ENDPOINTS.some(path => url.includes(path));
}
