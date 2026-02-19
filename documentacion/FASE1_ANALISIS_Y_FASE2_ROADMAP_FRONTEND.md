# TurnoYa · Fase 1 (Análisis Backend) + Fase 2 (Roadmap Frontend)

> Documento técnico **fuente de verdad** basado en código real del backend (`TurnoYaAPI`) y no solo en documentación histórica.
>
> Fecha de análisis: 2026-02-18

---

## 0) Alcance y criterio de verdad

- Se analizó el backend real en:
  - `TurnoYa.API` (controladores + configuración)
  - `TurnoYa.Infrastructure` (servicios + repositorios + DbContext)
  - `TurnoYa.Application` (DTOs + validadores + interfaces + mappings)
  - `TurnoYa.Core` (entidades y enums)
- Se contrastó contra la documentación de `documentacion_Api`.
- Cuando hubo discrepancias, este documento prioriza **implementación real actual**.

---

## 1) Estado real del backend (Fase 1)

## 1.1 Stack técnico real

- .NET 8 (`net8.0`)
- ASP.NET Core Web API
- Entity Framework Core 8 + SQL Server
- JWT Bearer Authentication
- FluentValidation
- AutoMapper
- Serilog
- Swagger (Swashbuckle)

## 1.2 Arquitectura real implementada

Arquitectura por capas (con matiz importante):

- `TurnoYa.API`: Controllers y configuración (`Program.cs`)
- `TurnoYa.Application`: Contratos (`Interfaces`), DTOs, Validadores, Mappings
- `TurnoYa.Core`: Entidades de dominio + interfaces de dominio (ej: `IBusinessRepository`)
- `TurnoYa.Infrastructure`: Implementaciones concretas (servicios, repositorio, DbContext)

### Observación clave

Aunque hay enfoque de Clean Architecture, hoy existe mezcla de estilos:

- `BusinessController` usa repositorio (`IBusinessRepository`) ✅
- `AppointmentsController`, `ServicesController`, `EmployeesController` y parte de negocio usan DbContext/servicios directos ⚠️

No es crítico para arrancar frontend, pero sí relevante para deuda técnica backend.

---

## 1.3 Endpoints existentes (inventario real)

Base route: `api/[controller]`

### AuthController (`/api/auth`)

1. `POST /api/auth/register` (anónimo)
2. `POST /api/auth/login` (anónimo)
3. `POST /api/auth/refresh` (anónimo)
4. `POST /api/auth/revoke/{userId}` (sin `[Authorize]` actualmente)
5. `PATCH /api/auth/users/{userId}/role` (sin `[Authorize]` actualmente)

### BusinessController (`/api/business`)

1. `GET /api/business`
2. `GET /api/business/{id}`
3. `GET /api/business/owner/{ownerId}`
4. `GET /api/business/nearby?latitude=&longitude=&radiusKm=`
5. `GET /api/business/search?query=&city=&category=`
6. `GET /api/business/category/{category}`
7. `GET /api/business/categories`
8. `POST /api/business` `[Authorize]`
9. `PUT /api/business/{id}` `[Authorize]`
10. `DELETE /api/business/{id}` `[Authorize]`
11. `GET /api/business/{id}/settings`
12. `PUT /api/business/{id}/settings` `[Authorize]`

### ServicesController (`/api/services`)

1. `GET /api/services/business/{businessId}`
2. `GET /api/services/{id}`
3. `POST /api/services/business/{businessId}` `[Authorize]`
4. `PUT /api/services/{id}` `[Authorize]`
5. `DELETE /api/services/{id}` `[Authorize]`

### EmployeesController (`/api/employees`)

1. `GET /api/employees/business/{businessId}`
2. `GET /api/employees/{id}`
3. `POST /api/employees/business/{businessId}` `[Authorize]`
4. `PUT /api/employees/{id}` `[Authorize]`
5. `DELETE /api/employees/{id}` `[Authorize]`

### AppointmentsController (`/api/appointments`)

1. `POST /api/appointments` `[Authorize]`
2. `GET /api/appointments/{id}` `[Authorize]`
3. `GET /api/appointments/my` `[Authorize]`
4. `GET /api/appointments/business/{businessId}` `[Authorize]`
5. `PATCH /api/appointments/{id}/confirm` `[Authorize]`
6. `PATCH /api/appointments/{id}/cancel` `[Authorize]`
7. `PATCH /api/appointments/{id}/complete` `[Authorize]`
8. `PATCH /api/appointments/{id}/noshow` `[Authorize]`

### PaymentsController (`/api/payments`)

1. `POST /api/payments/intent` `[Authorize]`
2. `GET /api/payments/{appointmentId}/status` `[Authorize]`
3. `POST /api/payments/wompi/webhook` `[AllowAnonymous]`

### AdminController (`/api/admin`)

1. `GET /api/admin/users?searchTerm=&role=&page=&pageSize=`

---

## 1.4 Flujos de negocio implementados hoy

## A) Autenticación

1. Registro:
   - Valida DTO
   - Verifica email único
   - Hashea password
   - Crea usuario
   - Genera `access token` (24h) + `refresh token` (7 días)
2. Login:
   - Verifica email/password/hash
   - Verifica `IsActive`
   - Revoca refresh tokens previos activos
   - Emite nuevo par de tokens
3. Refresh:
   - Toma token expirado + refresh token
   - Valida principal y refresh activo/no revocado/no vencido
   - Revoca refresh actual
   - Emite nuevos tokens

## B) Gestión de negocio

1. Descubrimiento público:
   - Listado general
   - Búsqueda por query/city/category
   - Nearby (Haversine en memoria tras query de negocios activos con coordenadas)
   - Categorías disponibles
2. Gestión del dueño:
   - Crear negocio (OwnerId desde JWT claim)
   - Actualizar/Eliminar (solo owner)
3. Configuración (`BusinessSettings`):
   - Consultar
   - Crear por defecto si no existe (en GET)
   - Actualizar (solo owner)

## C) Servicios y empleados

- CRUD ligado a negocio
- Protección de ownership por ownerId del negocio
- Persistencia directa con `ApplicationDbContext`

## D) Citas

1. Crear cita:
   - Valida servicio y negocio
   - Calcula `EndDate` por duración
   - Valida conflicto por solapamiento de horario
   - Crea con estado inicial `Pending`
2. Consultas:
   - `my`: citas del usuario autenticado
   - `business/{id}`: citas de negocio, solo dueño
   - `/{id}`: accesible por cliente dueño de la cita o dueño del negocio
3. Transiciones:
   - `confirm`: solo owner, `Pending -> Confirmed`
   - `cancel`: owner o cliente, no permite cancelar `Cancelled/Completed`
   - `complete`: solo owner, `Confirmed -> Completed`
   - `noshow`: solo owner, desde `Pending` o `Confirmed`

## E) Pagos (Wompi)

- `intent`: crea transacción (implementación simplificada/sandbox)
- `status`: consulta de estado simplificada
- `webhook`: valida firma HMAC y deja TODO para procesar evento

---

## 1.5 Relaciones entre entidades (modelo real)

- `User (1) -> (N) Business` por `OwnerId`
- `Business (1) -> (N) Service`
- `Business (1) -> (N) Employee`
- `Business (1) -> (N) Appointment`
- `User (1) -> (N) Appointment`
- `Service (1) -> (N) Appointment`
- `Employee (0..1) -> (N) Appointment` (nullable)
- `Appointment (1) -> (0..1) Review`
- `Appointment (1) -> (0..1) WompiTransaction`
- `Business (1) -> (0..1) BusinessSettings`
- `Appointment (1) -> (N) AppointmentStatusHistory`
- `User (1) -> (N) RefreshToken`

---

## 1.6 Validaciones (FluentValidation) clave

- Auth:
  - Password fuerte: min 8, mayúscula, minúscula, número, especial
  - Role registro permitido: `Customer | BusinessOwner`
- Business:
  - Name, Category, Address, City, Department con rangos
  - Validación opcional de email/web/lat/long/phone
- Service:
  - Price >= 0
  - Duration > 0 y <= 480
  - Si `RequiresDeposit` entonces `DepositAmount` requerido y <= Price
- Employee:
  - FirstName/LastName requeridos
- Appointment:
  - `BusinessId`, `ServiceId` requeridos
  - `ScheduledDate` futura
- Payment intent:
  - `AppointmentId` requerido, `Amount > 0`, `Currency` length=3

---

## 1.7 Inconsistencias detectadas y corrección documental

## A) Diferencias con docs históricas

1. Se documenta Firestore y estructuras no relacionales, pero backend real usa SQL Server + EF Core.
2. Se menciona `HealthController`/`/health`; no existe en código actual.
3. Se documentan rutas tipo `/api/businesses/...`; en código real predominan `/api/business/...` y `/api/services/business/{id}`.
4. Se listan muchos componentes “futuros” como si estuvieran implementados.
5. Se menciona endpoint de disponibilidad (`GET /api/appointments/availability`) pero hoy no está expuesto en controller.

## B) Inconsistencias internas de código (relevantes para frontend)

1. DTOs de `Employee` (`FirstName`, `LastName`) no coinciden con entidad `Employee` (`Name`).
2. DTO `CreateAppointmentDto` contiene `BusinessId`, pero `AppointmentService.CreateAsync` no lo usa para validar consistencia con `ServiceId`.
3. `AuthController` usa claims para rol en update-role, pero el endpoint no tiene `[Authorize]`.
4. `AuthController.RevokeToken` tampoco está protegido con `[Authorize]`.
5. `PaymentsController.GetStatus` recibe `appointmentId` en ruta pero llama servicio como si fuera `transactionId`.
6. `WompiService` implementa payload/status simplificados (útil para sandbox, no final productivo).

## C) Impacto práctico para frontend

- Frontend debe consumir los endpoints **tal como están** (rutas reales arriba).
- Debe contemplar que ciertas respuestas o reglas pueden cambiar cuando se normalicen inconsistencias.
- Conviene encapsular API por servicios para minimizar impacto de futuros cambios de contrato.

---

## 1.8 Ejemplos reales de request/response (según DTOs actuales)

> Nota: IDs son de ejemplo y estructura basada en controladores/DTOs actuales.

## Auth

### POST `/api/auth/register`

Request

```json
{
  "email": "owner@turnoya.com",
  "password": "SecurePass1!",
  "confirmPassword": "SecurePass1!",
  "firstName": "Laura",
  "lastName": "Rojas",
  "phone": "+573001112233",
  "role": "BusinessOwner"
}
```

Response `201`

```json
{
  "token": "<jwt>",
  "refreshToken": "<refresh_token>",
  "expiresIn": 86400,
  "user": {
    "id": "c6e5c5ae-4cc8-4f90-a91a-c4517d5f5f90",
    "email": "owner@turnoya.com",
    "firstName": "Laura",
    "lastName": "Rojas",
    "fullName": "Laura Rojas",
    "role": "BusinessOwner",
    "profilePictureUrl": null,
    "isEmailVerified": false,
    "createdAt": "2026-02-18T14:45:00Z"
  }
}
```

### POST `/api/auth/login`

Request

```json
{
  "email": "owner@turnoya.com",
  "password": "SecurePass1!"
}
```

Response `200` (misma estructura de `AuthResponseDto`)

### POST `/api/auth/refresh`

Request

```json
{
  "token": "<access_expirado>",
  "refreshToken": "<refresh_token_vigente>"
}
```

Response `200`: nuevo `token` + `refreshToken`.

---

## Business

### POST `/api/business` (Bearer token)

Request

```json
{
  "name": "Barbería Centro",
  "description": "Cortes clásicos y modernos",
  "category": "Barberia",
  "address": "Cra 10 #15-20",
  "city": "Bogota",
  "department": "Cundinamarca",
  "phone": "3001234567",
  "email": "contacto@barberiacentro.com",
  "website": "https://barberiacentro.com",
  "latitude": 4.6097,
  "longitude": -74.0817
}
```

Response `201`

```json
{
  "id": "f1d9fdbc-3f7c-44f0-b412-7d7fd1b0fd32",
  "name": "Barbería Centro",
  "description": "Cortes clásicos y modernos",
  "category": "Barberia",
  "address": "Cra 10 #15-20",
  "city": "Bogota",
  "department": "Cundinamarca",
  "phone": "3001234567",
  "email": "contacto@barberiacentro.com",
  "website": "https://barberiacentro.com",
  "latitude": 4.6097,
  "longitude": -74.0817,
  "averageRating": 0,
  "totalReviews": 0,
  "isActive": true,
  "createdAt": "2026-02-18T14:50:00Z",
  "ownerId": "c6e5c5ae-4cc8-4f90-a91a-c4517d5f5f90",
  "ownerName": "Laura Rojas"
}
```

### GET `/api/business/search?query=barber&city=Bogota&category=Barberia`

Response `200`: arreglo de `BusinessListDto`.

---

## Services

### POST `/api/services/business/{businessId}` (Bearer token owner)

Request

```json
{
  "name": "Corte + barba",
  "description": "Incluye perfilado",
  "price": 35000,
  "duration": 45,
  "requiresDeposit": true,
  "depositAmount": 10000,
  "isActive": true
}
```

Response `201`: `ServiceDto`.

---

## Employees

### POST `/api/employees/business/{businessId}` (Bearer token owner)

Request

```json
{
  "firstName": "Carlos",
  "lastName": "Gomez",
  "phone": "3009998877",
  "email": "carlos@barberiacentro.com",
  "position": "Barbero senior",
  "bio": "10 años de experiencia",
  "profilePictureUrl": "https://cdn.example.com/staff/carlos.jpg",
  "isActive": true
}
```

Response `201`: `EmployeeDto`.

---

## Appointments

### POST `/api/appointments` (Bearer token cliente)

Request

```json
{
  "businessId": "f1d9fdbc-3f7c-44f0-b412-7d7fd1b0fd32",
  "serviceId": "f47f0359-9c2a-4d2f-8d9b-2e2dd77b8f4a",
  "employeeId": "4257b9ea-2f77-4d25-a47f-857ad53e4e9a",
  "scheduledDate": "2026-02-20T15:00:00Z",
  "notes": "Prefiero corte clásico"
}
```

Response `201`

```json
{
  "id": "f7cb90bc-cef4-4a8a-9e3a-87d772db90da",
  "referenceNumber": "AP-20260218151230-AB12CD",
  "userId": "8f1b7a00-ecfe-47b5-9ae5-c95de5bb55a0",
  "businessId": "f1d9fdbc-3f7c-44f0-b412-7d7fd1b0fd32",
  "serviceId": "f47f0359-9c2a-4d2f-8d9b-2e2dd77b8f4a",
  "employeeId": "4257b9ea-2f77-4d25-a47f-857ad53e4e9a",
  "scheduledDate": "2026-02-20T15:00:00Z",
  "endDate": "2026-02-20T15:45:00Z",
  "status": "Pending",
  "totalAmount": 35000,
  "depositAmount": 0,
  "depositPaid": false,
  "notes": "Prefiero corte clásico"
}
```

### PATCH `/api/appointments/{id}/confirm` (owner)

Response `204` si éxito, `400` si transición inválida.

### PATCH `/api/appointments/{id}/cancel` (cliente u owner)

Request:

```json
{
  "reason": "No podré asistir"
}
```

Response `204` si éxito.

---

## Payments

### POST `/api/payments/intent` (Bearer token)

Request

```json
{
  "appointmentId": "f7cb90bc-cef4-4a8a-9e3a-87d772db90da",
  "amount": 10000,
  "currency": "COP",
  "paymentMethod": "Wompi"
}
```

Response `200`

```json
{
  "id": "6d9a42f6-5bd3-4fcb-8aa0-f6a7ef4dcd29",
  "reference": "PAY-20260218152001-A1B2C3",
  "amount": 10000,
  "currency": "COP",
  "status": "PENDING",
  "paymentMethod": "Wompi"
}
```

### POST `/api/payments/wompi/webhook`

Request body (ejemplo simplificado):

```json
{
  "event": "transaction.updated",
  "signature": "<firma>",
  "data": { "id": "wompi_tx_123" }
}
```

Response `200` si firma válida; hoy el procesamiento del evento está pendiente.

---

## 1.9 Riesgos/deuda técnica priorizada (para próximas fases backend)

1. Seguridad:
   - Endpoints `revoke` y `update-role` sin `[Authorize]`.
2. Consistencia de contratos:
   - DTO/Entity mismatch en `Employee`.
3. Pagos:
   - Estado y referencia transaccional simplificados.
4. Cobertura funcional faltante:
   - Falta endpoint HTTP para disponibilidad (`IAvailabilityService` existe, pero no controller).
5. Trazabilidad:
   - Estado de cita no persiste aún historial en `AppointmentStatusHistory`.

---

## 2) Planeación Frontend (Fase 2)

Objetivo: iniciar frontend con lo ya disponible en backend, usando:

- Ionic
- Angular
- Tailwind CSS

Sin bloquearse por endpoints pendientes: se construye integración progresiva + capas desacopladas.

---

## 2.1 Arquitectura frontend propuesta

## Estructura de alto nivel

- `core/`
  - auth (session, guards, interceptor)
  - http (api client base, manejo errores)
  - config (environment, constants)
- `shared/`
  - componentes UI reutilizables
  - pipes/directives
- `features/`
  - auth
  - catalog (business + services)
  - owner (negocio propio + empleados + servicios)
  - appointments (cliente y dueño)
  - payments
  - admin

## Convenciones clave

- Feature-first modular
- Tipado estricto con modelos por endpoint
- `ApiService` base + servicios especializados por módulo
- Estado local simple con RxJS (sin NgRx en arranque)
- DTOs frontend alineados con contratos backend actuales
- Manejo de errores normalizado (401/403/400/500)

---

## 2.2 Roadmap por fases

## Fase A · Setup e infraestructura

- Crear proyecto Ionic Angular
- Integrar Tailwind
- Definir arquitectura de carpetas
- Configurar environments
- Configurar `HttpClient`, interceptor JWT, manejo global de errores

## Fase B · Autenticación

- Pantallas login/registro
- Persistencia de sesión (access/refresh)
- Refresh token automático
- Guard para rutas protegidas

## Fase C · Descubrimiento y negocio

- Listado de negocios
- Búsqueda por filtros
- Detalle de negocio
- CRUD de negocio dueño
- Configuración de negocio

## Fase D · Servicios y empleados

- CRUD de servicios
- CRUD de empleados
- Vistas owner para administración

## Fase E · Citas

- Crear cita
- Mis citas (cliente)
- Agenda del negocio (owner)
- Cambios de estado (confirm/cancel/complete/noshow)

## Fase F · Pagos y admin inicial

- Crear intento de pago
- Consultar estado pago
- Módulo admin usuarios (búsqueda + paginación)

---

## 2.3 Cards tipo Jira (tareas pequeñas)

> Formato por card: Título · Descripción · Objetivo técnico · Criterios de aceptación · Dependencias

## EPIC 1 — Bootstrap

### CARD F-001 · Crear proyecto Ionic Angular
- Descripción: Inicializar app base con routing y estructura feature-first.
- Objetivo técnico: tener base ejecutable y escalable.
- Criterios de aceptación:
  - Proyecto arranca en `http://localhost:8100`.
  - Estructura `core/shared/features` creada.
  - Build de desarrollo exitoso.
- Dependencias: ninguna.

### CARD F-002 · Configurar Tailwind CSS
- Descripción: instalar y conectar Tailwind al proyecto Ionic.
- Objetivo técnico: habilitar utilidades visuales para UI.
- Criterios de aceptación:
  - Clases Tailwind aplican correctamente en vistas Ionic.
  - Configuración de purge/content correcta.
  - No rompe estilos base de Ionic.
- Dependencias: F-001.

### CARD F-003 · Configurar entornos y API base URL
- Descripción: definir `environment.dev/prod` y base URL backend.
- Objetivo técnico: desacoplar configuración de despliegue.
- Criterios de aceptación:
  - URL backend configurable por entorno.
  - Servicios HTTP consumen desde config central.
- Dependencias: F-001.

### CARD F-004 · Crear cliente HTTP base
- Descripción: implementar wrapper para GET/POST/PUT/PATCH/DELETE.
- Objetivo técnico: centralizar llamadas y headers comunes.
- Criterios de aceptación:
  - Servicio base reutilizable por módulos.
  - Soporte de query params tipados.
- Dependencias: F-003.

### CARD F-005 · Implementar interceptor JWT
- Descripción: añadir bearer token automáticamente cuando haya sesión.
- Objetivo técnico: autenticación homogénea en requests protegidos.
- Criterios de aceptación:
  - Header `Authorization: Bearer <token>` presente en rutas protegidas.
  - Rutas públicas (`/auth/*`, webhook si aplica) sin token forzado.
- Dependencias: F-004.

### CARD F-006 · Manejo global de errores HTTP
- Descripción: interceptor/resolvedor para 400/401/403/500.
- Objetivo técnico: UX consistente y trazabilidad de fallos.
- Criterios de aceptación:
  - 401 dispara flujo de refresh/logout.
  - Mensajes de validación 400 mostrados al usuario.
- Dependencias: F-005.

---

## EPIC 2 — Autenticación

### CARD F-010 · Crear módulo/páginas de Auth
- Descripción: pantallas de login y registro.
- Objetivo técnico: entrada al sistema con backend real.
- Criterios de aceptación:
  - Formularios con validación local.
  - Navegación a home tras login exitoso.
- Dependencias: F-002, F-004.

### CARD F-011 · Integrar endpoint register
- Descripción: conectar `POST /api/auth/register`.
- Objetivo técnico: creación de cuenta desde app.
- Criterios de aceptación:
  - Envía payload conforme a `RegisterUserDto`.
  - Maneja errores de email duplicado/validación.
- Dependencias: F-010.

### CARD F-012 · Integrar endpoint login
- Descripción: conectar `POST /api/auth/login`.
- Objetivo técnico: autenticación y almacenamiento de sesión.
- Criterios de aceptación:
  - Guarda `token`, `refreshToken`, expiración y user.
  - Redirige correctamente según rol.
- Dependencias: F-010.

### CARD F-013 · Implementar refresh automático
- Descripción: renovar access token usando refresh al detectar expiración.
- Objetivo técnico: sesión persistente sin fricción.
- Criterios de aceptación:
  - Usa `POST /api/auth/refresh`.
  - Si falla refresh, limpia sesión y redirige a login.
- Dependencias: F-012, F-005, F-006.

### CARD F-014 · Guard de rutas protegidas
- Descripción: bloquear pantallas privadas sin sesión válida.
- Objetivo técnico: reforzar seguridad del lado cliente.
- Criterios de aceptación:
  - Acceso no autenticado redirige a login.
  - Acceso autenticado permitido según rol.
- Dependencias: F-012.

---

## EPIC 3 — Catálogo y negocios

### CARD F-020 · Crear página listado de negocios
- Descripción: vista pública con `GET /api/business`.
- Objetivo técnico: descubrimiento inicial de oferta.
- Criterios de aceptación:
  - Renderiza lista con loading/error/empty states.
  - Tarjetas muestran nombre, categoría, ciudad, rating.
- Dependencias: F-004.

### CARD F-021 · Implementar búsqueda y filtros
- Descripción: conectar `GET /api/business/search` y categorías.
- Objetivo técnico: mejorar conversión de búsqueda.
- Criterios de aceptación:
  - Filtros por `query`, `city`, `category` funcionales.
  - Query params reflejados en URL.
- Dependencias: F-020.

### CARD F-022 · Crear detalle de negocio
- Descripción: integrar `GET /api/business/{id}`.
- Objetivo técnico: mostrar servicios y empleados del negocio.
- Criterios de aceptación:
  - Muestra info principal + listas relacionadas.
  - Maneja 404 con pantalla amigable.
- Dependencias: F-020.

### CARD F-023 · Crear módulo owner business
- Descripción: crear/editar/eliminar negocio del dueño.
- Objetivo técnico: habilitar operación del negocio.
- Criterios de aceptación:
  - Conecta `POST`, `PUT`, `DELETE /api/business`.
  - Restringido por sesión autenticada.
- Dependencias: F-014, F-004.

### CARD F-024 · Configuración de negocio
- Descripción: consumir `GET/PUT /api/business/{id}/settings`.
- Objetivo técnico: exponer reglas de booking y horarios.
- Criterios de aceptación:
  - Formulario mapea `BusinessSettingsDto` actual.
  - Guardado persiste cambios y refresca vista.
- Dependencias: F-023.

---

## EPIC 4 — Servicios y empleados

### CARD F-030 · CRUD servicios de negocio
- Descripción: integrar endpoints de `ServicesController`.
- Objetivo técnico: permitir al dueño administrar oferta.
- Criterios de aceptación:
  - Listar, crear, editar, eliminar servicios.
  - Validar campos de precio, duración y depósito.
- Dependencias: F-023.

### CARD F-031 · CRUD empleados de negocio
- Descripción: integrar endpoints de `EmployeesController`.
- Objetivo técnico: gestionar staff por negocio.
- Criterios de aceptación:
  - Listar, crear, editar, eliminar empleados.
  - Manejo de discrepancias DTO/entidad sin romper UI.
- Dependencias: F-023.

---

## EPIC 5 — Citas

### CARD F-040 · Crear flujo “agendar cita”
- Descripción: pantalla de reserva + `POST /api/appointments`.
- Objetivo técnico: core transaccional de cliente.
- Criterios de aceptación:
  - Selección de negocio/servicio/empleado/fecha.
  - Manejo de conflictos de horario (mensaje backend).
- Dependencias: F-022, F-030, F-031.

### CARD F-041 · Mis citas (cliente)
- Descripción: integrar `GET /api/appointments/my`.
- Objetivo técnico: seguimiento de reservas del usuario.
- Criterios de aceptación:
  - Filtros por fechas/estado.
  - Render de estado y referencia.
- Dependencias: F-040.

### CARD F-042 · Agenda de negocio (owner)
- Descripción: integrar `GET /api/appointments/business/{businessId}`.
- Objetivo técnico: operación diaria del negocio.
- Criterios de aceptación:
  - Lista por rango de fechas.
  - Acciones rápidas por cita.
- Dependencias: F-023.

### CARD F-043 · Cambios de estado de cita
- Descripción: integrar confirm/cancel/complete/noshow.
- Objetivo técnico: completar ciclo de vida de la cita.
- Criterios de aceptación:
  - Llama PATCH correcto según acción.
  - Actualiza UI sin recarga completa.
- Dependencias: F-042.

---

## EPIC 6 — Pagos y administración

### CARD F-050 · Integrar crear intento de pago
- Descripción: `POST /api/payments/intent`.
- Objetivo técnico: habilitar pagos/depositos en flujo de cita.
- Criterios de aceptación:
  - Envía `CreatePaymentIntentDto` válido.
  - Muestra referencia y estado inicial.
- Dependencias: F-040.

### CARD F-051 · Integrar estado de pago
- Descripción: `GET /api/payments/{appointmentId}/status`.
- Objetivo técnico: feedback de pago al usuario.
- Criterios de aceptación:
  - Consulta periódica/manual del estado.
  - Maneja `404` de forma clara.
- Dependencias: F-050.

### CARD F-052 · Módulo admin usuarios
- Descripción: `GET /api/admin/users` con filtros y paginación.
- Objetivo técnico: dar capacidad de administración básica.
- Criterios de aceptación:
  - Tabla paginada con `TotalCount/TotalPages`.
  - Búsqueda por término y rol.
- Dependencias: F-014.

---

## EPIC 7 — Calidad y entrega

### CARD F-060 · Estandarizar contratos de API frontend
- Descripción: definir interfaces TS por endpoint usado.
- Objetivo técnico: evitar errores por tipado inconsistente.
- Criterios de aceptación:
  - Modelos centralizados por feature.
  - Sin uso de `any` en capa API.
- Dependencias: F-004.

### CARD F-061 · Observabilidad frontend mínima
- Descripción: logging de errores de red y tracking de fallos de auth.
- Objetivo técnico: acelerar debug en QA.
- Criterios de aceptación:
  - Logs de error categorizados por módulo.
  - Captura de 401/403/500 con contexto.
- Dependencias: F-006.

### CARD F-062 · Checklist de salida a QA
- Descripción: validar flujos críticos E2E manuales.
- Objetivo técnico: asegurar estabilidad antes de pruebas formales.
- Criterios de aceptación:
  - Login/register/refresh OK.
  - Crear negocio, servicio, empleado OK.
  - Crear y transicionar cita OK.
  - Intento de pago y consulta de estado OK.
- Dependencias: F-011 a F-051.

---

## 2.4 Documento paso a paso (implementación por fases)

## Paso 1 — Crear proyecto

1. Crear app Ionic Angular.
2. Configurar routing y estructura feature-first.
3. Definir convenciones de nombres (`feature`, `page`, `service`, `model`).

## Paso 2 — Instalar/configurar dependencias

1. Tailwind CSS.
2. Librerías utilitarias mínimas (solo lo necesario para MVP).
3. Environments (`apiBaseUrl`) por entorno.

## Paso 3 — Infraestructura técnica

1. Cliente HTTP base.
2. Interceptor JWT.
3. Interceptor de errores.
4. Servicio de sesión (token + refresh + user actual).

## Paso 4 — Módulo autenticación

1. Pantallas login/registro.
2. Integración `register`/`login`.
3. Refresh automático.
4. Guards por autenticación y rol.

## Paso 5 — Módulo catálogo/negocios

1. Listado público.
2. Búsqueda/filtros/categorías.
3. Detalle de negocio.
4. Gestión owner del negocio y settings.

## Paso 6 — Módulo operación owner

1. CRUD servicios.
2. CRUD empleados.

## Paso 7 — Módulo citas

1. Crear cita (cliente).
2. Mis citas.
3. Agenda del negocio.
4. Transiciones de estado.

## Paso 8 — Pagos y admin

1. Crear intento de pago.
2. Consultar estado de pago.
3. Búsqueda de usuarios (admin).

## Paso 9 — Cierre de fase

1. Hardening UX de errores.
2. Checklist QA.
3. Documentar pendientes por endpoints faltantes backend.

---

## 2.5 Estrategia para convivir con backend incompleto

- Diseñar capa API desacoplada por servicio (evita retrabajo)
- Implementar fallback visual para endpoints no disponibles
- Marcar features como `beta` donde backend aún esté parcial
- Priorizar contratos estables ya existentes (auth, business, services, employees, appointments, payments, admin-users)

---

## 3) Conclusión ejecutiva

1. El backend ya cubre flujo principal de negocio: auth, negocio, servicios, empleados, citas y pago básico.
2. La documentación histórica tenía partes desactualizadas; este documento corrige el estado real.
3. El frontend puede empezar inmediatamente con Ionic + Angular + Tailwind sobre endpoints existentes.
4. Se deja roadmap con cards pequeñas, dependencias y criterios de aceptación para ejecución incremental.
