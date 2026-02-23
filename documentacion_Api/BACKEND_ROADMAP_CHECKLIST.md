# TurnoYa Backend - Roadmap Checklist

Use this checklist to mark each card as completed.

## EPIC 1 - Base API
- [x] Estandarizar respuestas de error (ProblemDetails) (Priority: Medium, Points: 3)
- [x] Validaciones globales y mensajes consistentes (Priority: Medium, Points: 3)
- [ ] Versionado de API (v1) (Priority: Low, Points: 2)

## EPIC 2 - Autenticacion y seguridad
- [x] Registro de usuarios (Priority: High, Points: 3)
- [x] Login y JWT (Priority: High, Points: 3)
- [x] Refresh token (Priority: Medium, Points: 2)
- [ ] Logout / revocar refresh token (Priority: Medium, Points: 2)
- [ ] Politicas por rol (Admin/Owner/Customer) (Priority: Medium, Points: 3)

## EPIC 3 - Perfil y cuenta
- [x] GET /api/users/me (Priority: High, Points: 3, Depends: EPIC2)
- [x] PUT /api/users/me (Priority: High, Points: 3, Depends: EPIC2)
- [x] PATCH /api/users/me/password (Priority: High, Points: 3, Depends: EPIC2)

## EPIC 4 - Admin usuarios
- [x] GET /api/admin/users (Priority: High, Points: 5, Depends: EPIC2)
- [x] GET /api/admin/users/{id} (Priority: Medium, Points: 3, Depends: EPIC2)
- [x] PATCH /api/admin/users/{id}/status (Priority: Medium, Points: 3, Depends: EPIC2)
- [x] PATCH /api/admin/users/{id}/role (Priority: Medium, Points: 3, Depends: EPIC2)

## EPIC 5 - Citas y pagos
- [ ] Endpoints de pagos (definir con negocio) (Priority: Medium, Points: 5)

## Mejoras en curso

- [ ] Soporte a autocompletado de ciudades (para frontend)
  - Descripción: Si el frontend requiere sugerencias de ciudades desde el backend (en vez de Google Places), exponer un endpoint `/api/cities/autocomplete?query=...` que devuelva ciudades sugeridas según el texto ingresado.
  - Alternativa: Si se usa Google Places, no se requiere cambio backend.
  - Estado: pendiente de análisis según decisión frontend.

## Calidad y entrega
- [ ] Tests de servicios criticos (Priority: Medium, Points: 3)
- [ ] Logs estructurados y trazabilidad (Priority: Low, Points: 2)
- [ ] Checklist de QA backend (Priority: High, Points: 1)
