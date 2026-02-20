# TurnoYa Backend - Roadmap Checklist

Use this checklist to mark each card as completed.

## EPIC 1 - Base API
- [ ] Estandarizar respuestas de error (ProblemDetails) (Priority: Medium, Points: 3)
- [ ] Validaciones globales y mensajes consistentes (Priority: Medium, Points: 3)
- [ ] Versionado de API (v1) (Priority: Low, Points: 2)

## EPIC 2 - Autenticacion y seguridad
- [x] Registro de usuarios (Priority: High, Points: 3)
- [x] Login y JWT (Priority: High, Points: 3)
- [x] Refresh token (Priority: Medium, Points: 2)
- [ ] Logout / revocar refresh token (Priority: Medium, Points: 2)
- [ ] Politicas por rol (Admin/Owner/Customer) (Priority: Medium, Points: 3)

## EPIC 3 - Perfil y cuenta
- [ ] GET /api/users/me (Priority: High, Points: 3, Depends: EPIC2)
- [ ] PUT /api/users/me (Priority: High, Points: 3, Depends: EPIC2)
- [ ] PATCH /api/users/me/password (Priority: High, Points: 3, Depends: EPIC2)

## EPIC 4 - Admin usuarios
- [ ] GET /api/admin/users (Priority: High, Points: 5, Depends: EPIC2)
- [ ] GET /api/admin/users/{id} (Priority: Medium, Points: 3, Depends: EPIC2)
- [ ] PATCH /api/admin/users/{id}/status (Priority: Medium, Points: 3, Depends: EPIC2)
- [ ] PATCH /api/admin/users/{id}/role (Priority: Medium, Points: 3, Depends: EPIC2)

## EPIC 5 - Citas y pagos
- [ ] Endpoints de pagos (definir con negocio) (Priority: Medium, Points: 5)

## Calidad y entrega
- [ ] Tests de servicios criticos (Priority: Medium, Points: 3)
- [ ] Logs estructurados y trazabilidad (Priority: Low, Points: 2)
- [ ] Checklist de QA backend (Priority: High, Points: 1)
