# Checklist MVP - TurnoYa (6 de febrero de 2026)

## Revision paso a paso (MVP)

### 1) Registro y autenticacion
- Implementado en backend y mobile (login/register/refresh).
- Falta ajustar endpoint en mobile para cambio de rol: backend expone `PATCH /Auth/users/{id}/role`, pero mobile llama `PATCH /users/{id}/role`.
- Referencias:
  - TurnoYaAPI/TurnoYa.API/Controllers/AuthController.cs
  - TurnoYaMobile/src/app/core/services/auth.service.ts

### 2) Creacion y gestion de negocios
- Backend tiene CRUD y settings.
- Mobile tiene list/detail/form, pero pide paginacion y endpoint `my-businesses` que no existe en backend.
- Referencias:
  - TurnoYaAPI/TurnoYa.API/Controllers/BusinessController.cs
  - TurnoYaMobile/src/app/core/services/business.service.ts

### 3) Creacion de servicios
- Backend tiene CRUD de servicios.
- Mobile permite crear/editar.
- Falta asignacion de empleados a servicios: mobile llama `POST /Services/{id}/employees` y `GET /Services/{id}/employees`, pero no existen endpoints en backend.
- Referencias:
  - TurnoYaAPI/TurnoYa.API/Controllers/ServicesController.cs
  - TurnoYaMobile/src/app/core/services/service.service.ts

### 4) Empleados y horarios
- Backend maneja empleados, pero no hay horarios por empleado (ni entidad ni endpoints).
- Mobile usa formulario con `userId` y `role`, mientras backend espera datos personales (`firstName`, `lastName`, etc.).
- Referencias:
  - TurnoYaAPI/TurnoYa.Core/Entities/Employee.cs
  - TurnoYaAPI/TurnoYa.Application/DTOs/Employee/CreateEmployeeDto.cs
  - TurnoYaMobile/src/app/features/business/employees/employee-form.page.ts

### 5) Disponibilidad de citas
- Existe `IAvailabilityService` y su logica, pero no hay controller ni endpoint.
- Mobile intenta llamar `GET /Appointments/availability`, que no existe.
- Referencias:
  - TurnoYaAPI/TurnoYa.Infrastructure/Services/AvailabilityService.cs
  - TurnoYaMobile/src/app/core/services/appointment.service.ts

### 6) Creacion/edicion/cancelacion de citas
- Backend permite crear, confirmar, cancelar, completar, no-show.
- Mobile usa campos `startDate` y endpoints `PUT /Appointments/{id}`, `DELETE /Appointments/{id}`, `PATCH /Appointments/{id}/status` que no existen.
- Backend espera `ScheduledDate`.
- Referencias:
  - TurnoYaAPI/TurnoYa.API/Controllers/AppointmentsController.cs
  - TurnoYaAPI/TurnoYa.Application/DTOs/Appointment/CreateAppointmentDto.cs
  - TurnoYaMobile/src/app/core/services/appointment.service.ts
  - TurnoYaMobile/src/app/features/appointments/create/appointment-create.page.ts

### 7) Control de estados de citas
- Backend maneja estados basicos, pero no registra historial ni expone endpoint para ver historial.
- Referencias:
  - TurnoYaAPI/TurnoYa.Core/Entities/AppointmentStatusHistory.cs

### 8) Pagos (Wompi)
- Backend tiene stub de Wompi y webhook sin procesamiento real.
- No se guarda transaccion ni se vincula con cita.
- Mobile no tiene flujo de pagos (carpeta payments vacia).
- Referencias:
  - TurnoYaAPI/TurnoYa.API/Controllers/PaymentsController.cs
  - TurnoYaAPI/TurnoYa.Infrastructure/Services/WompiService.cs
  - TurnoYaMobile/src/app/features/payments

### 9) Panel basico de administracion
- Backend tiene busqueda de usuarios, pero el endpoint no exige `Authorize` ni rol admin.
- Mobile tiene UI para listado y cambio de rol.
- Referencias:
  - TurnoYaAPI/TurnoYa.API/Controllers/AdminController.cs
  - TurnoYaMobile/src/app/features/admin/admin-dashboard.page.ts

### 10) Frontend web
- No hay implementacion (solo checklist en Frond).
- Referencias:
  - Frond

## Checklist de funcionalidades faltantes (por sprint)

### Sprint 1 - Integracion y coherencia de endpoints
- [ ] Ajustar contratos de citas: `ScheduledDate` vs `startDate` y eliminar endpoints inexistentes en mobile o implementarlos en backend.
- [ ] Exponer endpoint de disponibilidad (controller) y enlazarlo al mobile.
- [ ] Corregir endpoint de cambio de rol en mobile (`/Auth/users/{id}/role`).
- [ ] Revisar `/Business` en mobile: eliminar paginacion si no existe en backend o implementarla.
- [ ] Implementar `/Business/my-businesses` o cambiar mobile a `GET /Business/owner/{ownerId}`.
- [ ] Definir respuesta consistente de API (siempre data o directo).

### Sprint 2 - Empleados, horarios y asignacion a servicios
- [ ] Alinear DTOs de empleados: backend espera nombre y contacto, mobile envia `userId/role`.
- [ ] Definir horario por empleado (entidad + DTO + endpoints).
- [ ] Implementar asignacion de empleados a servicios (`/Services/{id}/employees`).
- [ ] Ajustar UI de empleados en mobile para capturar datos reales requeridos.
- [ ] Implementar reglas de disponibilidad por empleado si aplica.

### Sprint 3 - Citas completas y estados
- [ ] Implementar edicion/actualizacion real de citas en backend (si se mantiene en mobile).
- [ ] Implementar eliminacion de citas (si se mantiene en mobile).
- [ ] Registrar historial de estados de cita y exponerlo en API.
- [ ] Sincronizar estados en UI con los endpoints reales (`confirm`, `complete`, `cancel`, `noshow`).
- [ ] Validaciones: solapamiento, cancelacion con ventanas de tiempo, etc.

### Sprint 4 - Pagos (Wompi) y validacion de monetizacion
- [ ] Persistir transacciones Wompi y vincularlas a la cita.
- [ ] Procesar webhook real y actualizar `PaymentStatus`.
- [ ] Agregar flujo de pago en mobile (pantalla + servicio + modelo).
- [ ] Definir comportamiento de deposito/reembolso si aplica.

### Sprint 5 - Panel admin y seguridad
- [ ] Proteger endpoints admin con `Authorize` + rol.
- [ ] Agregar controles de acceso en backend (owner vs employee vs customer).
- [ ] Revisar permisos en controllers criticos (servicios, empleados, citas).
