# TurnoYa Backend - Checklist de Desarrollo

> Lista completa de tareas para desarrollar el backend de TurnoYa paso a paso. Marca cada checkbox ✅ a medida que completes las tareas.

---

## 📋 Índice de Fases

- [Fase 1: Fundamentos y Autenticación](#fase-1-fundamentos-y-autenticación)
- [Fase 2: Gestión de Negocios](#fase-2-gestión-de-negocios)
- [Fase 3: Sistema de Citas](#fase-3-sistema-de-citas)
- [Fase 4: Pagos con Wompi](#fase-4-pagos-con-wompi)
- [Fase 5: Reseñas y Reputación](#fase-5-reseñas-y-reputación)
- [Fase 6: Características Avanzadas](#fase-6-características-avanzadas)
- [Fase 7: Testing y Calidad](#fase-7-testing-y-calidad)
- [Fase 8: Optimización y Producción](#fase-8-optimización-y-producción)

---

## Fase 1: Fundamentos y Autenticación

### 1.1 Preparación del Proyecto
- [x] Crear estructura de solución (.NET 8)
- [x] Configurar proyectos (API, Core, Infrastructure, Application)
- [x] Instalar paquetes NuGet necesarios
- [x] Configurar appsettings.json (ConnectionString, JWT)
- [x] Crear entidades de dominio
- [x] Configurar ApplicationDbContext
- [x] Aplicar migración baseline
- [x] Crear HealthController

### 1.2 DTOs de Autenticación
- [x] Crear carpeta `Application/DTOs/Auth`
- [x] Crear `RegisterUserDto`
  - [x] Email, Password, ConfirmPassword, FirstName, LastName, Phone
  - [x] Validaciones con FluentValidation
- [x] Crear `LoginDto`
  - [x] Email, Password
  - [x] Validaciones
- [x] Crear `AuthResponseDto`
  - [x] Token, RefreshToken, ExpiresIn, User info
- [x] Crear `RefreshTokenDto`
  - [x] Token, RefreshToken
- [x] Crear `UserDto`
  - [x] Id, Email, FirstName, LastName, Role, ProfilePictureUrl

### 1.3 Servicios de Autenticación
- [x] Crear interfaz `Application/Interfaces/IAuthService.cs`
  - [x] RegisterAsync(RegisterUserDto)
  - [x] LoginAsync(LoginDto)
  - [x] RefreshTokenAsync(RefreshTokenDto)
  - [x] RevokeTokenAsync(string userId)
- [x] Crear interfaz `Application/Interfaces/ITokenService.cs`
  - [x] GenerateAccessToken(User user)
  - [x] GenerateRefreshToken()
  - [x] ValidateToken(string token)
  - [x] GetPrincipalFromExpiredToken(string token)
- [x] Implementar `Infrastructure/Services/TokenService.cs`
  - [x] Lógica de generación JWT
  - [x] Validación de tokens
- [x] Implementar `Infrastructure/Services/AuthService.cs`
  - [x] Registro con hash de contraseña
  - [x] Login con verificación
  - [x] Refresh token logic

### 1.4 Entidad RefreshToken
- [x] Crear `Core/Entities/RefreshToken.cs`
  - [x] Id, UserId, Token, ExpiresAt, CreatedAt, RevokedAt
- [x] Agregar DbSet en ApplicationDbContext
- [x] Configurar relación User-RefreshTokens en OnModelCreating
- [x] Crear migración `dotnet ef migrations add AddAuthenticationFields`
- [x] Aplicar migración
- [x] Actualizar entidad User con campos de autenticación

### 1.5 Repositorios (OPCIONAL - No implementado, se usa DbContext directamente)
- [ ] Crear `Core/Interfaces/IGenericRepository.cs`
  - [ ] GetByIdAsync, GetAllAsync, AddAsync, UpdateAsync, DeleteAsync
- [ ] Crear `Infrastructure/Repositories/GenericRepository.cs`
- [ ] Crear `Core/Interfaces/IUserRepository.cs`
  - [ ] GetByEmailAsync, ExistsAsync
- [ ] Crear `Infrastructure/Repositories/UserRepository.cs`
- [ ] Registrar repositorios en DI (Program.cs)
- **Nota**: AuthService usa ApplicationDbContext directamente. Los repositorios son opcionales para este módulo.

### 1.6 AuthController
- [x] Crear `API/Controllers/AuthController.cs`
- [x] Endpoint `POST /api/auth/register`
  - [x] Validar DTO
  - [x] Llamar AuthService.RegisterAsync
  - [x] Retornar 201 Created con token
- [x] Endpoint `POST /api/auth/login`
  - [x] Validar DTO
  - [x] Llamar AuthService.LoginAsync
  - [x] Retornar 200 OK con token
- [x] Endpoint `POST /api/auth/refresh`
  - [x] Validar refresh token
  - [x] Generar nuevo access token
  - [x] Retornar nuevo token
- [x] Endpoint `POST /api/auth/revoke/{userId}`
  - [x] Marcar refresh token como revocado
  - [x] Retornar 204 No Content
- [x] Manejo de excepciones con try-catch

### 1.7 Perfiles de AutoMapper
- [x] Crear `Application/Mappings/AuthProfile.cs`
  - [x] RegisterUserDto → User
  - [x] User → UserDto
  - [x] User → AuthResponseDto (construido manualmente)
- [x] Registrar AutoMapper en Program.cs

### 1.8 Validadores
- [x] Crear `Application/Validators/RegisterUserDtoValidator.cs`
  - [x] Email válido y único
  - [x] Password mínimo 8 caracteres, mayúscula, número
  - [x] ConfirmPassword coincide
  - [x] FirstName y LastName requeridos
- [x] Crear `Application/Validators/LoginDtoValidator.cs`
  - [x] Email y Password requeridos
- [x] Registrar validadores en Program.cs con FluentValidation

### 1.9 Pruebas de Autenticación (Pendiente - Realizar manualmente)
- [X] Probar registro de usuario en Swagger
- [X] Probar login con credenciales correctas
- [] Probar login con credenciales incorrectas
- [ ] Probar refresh token
- [ ] Verificar tokens en JWT.io
- [ ] Probar endpoints protegidos sin token (401)
- [ ] Probar endpoints protegidos con token válido (200)

**Nota**: La aplicación está corriendo en http://localhost:5185/swagger. Todos los endpoints están implementados y listos para probar.

---

## Fase 2: Gestión de Negocios

### 2.1 DTOs de Negocios
- [x] Crear carpeta `Application/DTOs/Business`
- [x] Crear `CreateBusinessDto`
  - [x] Name, Description, Category, Address, City, Department
  - [x] Phone, Email, Website, Latitude, Longitude
- [x] Crear `UpdateBusinessDto`
- [x] Crear `BusinessDto`
  - [x] Incluir Owner info, AverageRating, TotalReviews
- [x] Crear `BusinessListDto` (para listados)
- [x] Crear `BusinessDetailDto` (con Services, Employees)

### 2.2 Servicios de Negocios
- [x] Crear `Core/Interfaces/IBusinessRepository.cs`
  - [x] GetByOwnerIdAsync
  - [x] GetByCategoryAsync
  - [x] GetNearbyAsync(latitude, longitude, radiusKm)
  - [x] SearchAsync(query, city, category)
- [x] Crear `Infrastructure/Repositories/BusinessRepository.cs`
  - [x] Implementar búsqueda geolocalizada (Haversine formula)
- [ ] Crear `Application/Interfaces/IBusinessService.cs` (opcional)
  - [ ] CreateAsync, UpdateAsync, DeleteAsync
  - [ ] GetByIdAsync, GetMyBusinessesAsync
  - [ ] SearchNearbyAsync, SearchAsync
- [ ] Crear `Application/Services/BusinessService.cs` (opcional)

### 2.3 BusinessController
- [x] Crear `API/Controllers/BusinessController.cs`
- [x] Endpoint `POST /api/business` [Authorize]
  - [x] Crear negocio para usuario autenticado
  - [x] Obtener OwnerId del JWT
- [x] Endpoint `GET /api/business/{id}`
  - [x] Retornar detalle completo del negocio
- [x] Endpoint `PUT /api/business/{id}` [Authorize]
  - [x] Actualizar solo si es owner
- [x] Endpoint `DELETE /api/business/{id}` [Authorize]
  - [x] Delete (hard delete implementado)
- [x] Endpoint `GET /api/business/owner/{ownerId}`
  - [x] Listar negocios por OwnerId
- [x] Endpoint `GET /api/business/search`
  - [x] Query params: ?query=&city=&category=
- [x] Endpoint `GET /api/business/nearby`
  - [x] Query params: ?latitude=&longitude=&radiusKm=
- [x] Endpoint `GET /api/business/category/{category}`
  - [x] Listar por categoría
- [x] Endpoint `GET /api/business`
  - [x] Listar todos los negocios activos

### 2.4 Validadores de Negocios
- [x] Crear `CreateBusinessDtoValidator`
  - [x] Name requerido (3-100 caracteres)
  - [x] Category requerido
  - [x] Address, City, Department requeridos
  - [x] Email válido (si se proporciona)
  - [x] Latitude/Longitude en rangos válidos
  - [x] Phone con formato válido
  - [x] Website con formato válido
- [x] Crear `UpdateBusinessDtoValidator`
  - [x] Validaciones condicionales para campos opcionales

### 2.5 Perfiles de AutoMapper
- [x] Crear `Application/Mappings/BusinessProfile.cs`
  - [x] CreateBusinessDto → Business
  - [x] UpdateBusinessDto → Business
  - [x] Business → BusinessDto
  - [x] Business → BusinessListDto
  - [x] Business → BusinessDetailDto
- [x] Registrar BusinessProfile en Program.cs

### 2.6 Pruebas de Negocios
- [X] Crear negocio como usuario autenticado
- [X] Listar mis negocios
- [ ] Buscar negocios por ciudad y categoría
- [ ] Buscar negocios cercanos con geolocalización
- [ ] Actualizar negocio propio
- [ ] Intentar actualizar negocio de otro usuario (403 Forbidden)
- [ ] Soft delete de negocio

---

## Fase 3: Sistema de Citas

### 3.1 Configuración de Negocio (BusinessSettings)
- [ ] Crear `Application/DTOs/Business/BusinessSettingsDto`
  - [ ] WorkingHours (JSON o tabla separada)
  - [ ] BookingAdvanceDays, CancellationHours
  - [ ] RequiresDeposit, NoShowPolicy
- [ ] Endpoint `PUT /api/businesses/{id}/settings` [Authorize]
- [ ] Endpoint `GET /api/businesses/{id}/settings`

### 3.2 Servicios del Negocio (Services)
- [ ] Crear `Application/DTOs/Service/CreateServiceDto`
  - [ ] BusinessId, Name, Description, Price, Duration
  - [ ] RequiresDeposit, DepositAmount
- [ ] Crear `ServiceDto`
- [ ] Crear `Application/Interfaces/IServiceService.cs`
- [ ] Crear `Application/Services/ServiceService.cs`
- [ ] Crear `API/Controllers/ServicesController.cs`
- [ ] Endpoint `POST /api/businesses/{businessId}/services` [Authorize]
- [ ] Endpoint `GET /api/businesses/{businessId}/services`
- [ ] Endpoint `PUT /api/services/{id}` [Authorize]
- [ ] Endpoint `DELETE /api/services/{id}` [Authorize]
- [ ] Validar que solo owner del negocio puede CRUD services

### 3.3 Empleados
- [ ] Crear `Application/DTOs/Employee/CreateEmployeeDto`
- [ ] Crear `EmployeeDto`
- [ ] Crear `Application/Interfaces/IEmployeeService.cs`
- [ ] Crear `Application/Services/EmployeeService.cs`
- [ ] Crear `API/Controllers/EmployeesController.cs`
- [ ] Endpoint `POST /api/businesses/{businessId}/employees` [Authorize]
- [ ] Endpoint `GET /api/businesses/{businessId}/employees`
- [ ] Endpoint `PUT /api/employees/{id}` [Authorize]
- [ ] Endpoint `DELETE /api/employees/{id}` [Authorize]

### 3.4 Disponibilidad de Citas
- [ ] Crear `Application/DTOs/Appointment/AvailabilityQueryDto`
  - [ ] BusinessId, ServiceId, EmployeeId (opcional), Date
- [ ] Crear `Application/DTOs/Appointment/TimeSlotDto`
  - [ ] StartTime, EndTime, IsAvailable
- [ ] Crear `Application/Interfaces/IAvailabilityService.cs`
  - [ ] GetAvailableSlotsAsync(AvailabilityQueryDto)
- [ ] Crear `Application/Services/AvailabilityService.cs`
  - [ ] Calcular slots basado en:
    - [ ] Horarios de trabajo del negocio
    - [ ] Duración del servicio
    - [ ] Citas existentes
    - [ ] Días de antelación permitidos
- [ ] Endpoint `GET /api/appointments/availability`
  - [ ] Query params: ?businessId=xxx&serviceId=xxx&date=2025-11-26

### 3.5 DTOs de Citas
- [ ] Crear `Application/DTOs/Appointment/CreateAppointmentDto`
  - [ ] BusinessId, ServiceId, EmployeeId (opcional)
  - [ ] ScheduledDate, Notes
- [ ] Crear `AppointmentDto`
  - [ ] Incluir User, Business, Service, Employee info
  - [ ] Status, ReferenceNumber, TotalAmount
- [ ] Crear `UpdateAppointmentStatusDto`
  - [ ] Status, Reason (para cancelaciones)

### 3.6 Servicios de Citas
- [ ] Crear `Core/Interfaces/IAppointmentRepository.cs`
  - [ ] GetByUserIdAsync, GetByBusinessIdAsync
  - [ ] GetByDateRangeAsync
  - [ ] CheckConflictAsync
- [ ] Crear `Infrastructure/Repositories/AppointmentRepository.cs`
- [ ] Crear `Application/Interfaces/IAppointmentService.cs`
  - [ ] CreateAsync, CancelAsync, ConfirmAsync, CompleteAsync
  - [ ] GetByIdAsync, GetMyAppointmentsAsync
  - [ ] GetBusinessAppointmentsAsync
- [ ] Crear `Application/Services/AppointmentService.cs`
  - [ ] Validar slot disponible antes de crear
  - [ ] Generar ReferenceNumber único
  - [ ] Calcular TotalAmount basado en Service
  - [ ] Registrar cambio de estado en AppointmentStatusHistory

### 3.7 AppointmentsController
- [ ] Crear `API/Controllers/AppointmentsController.cs`
- [ ] Endpoint `POST /api/appointments` [Authorize]
  - [ ] Crear cita
  - [ ] Validar disponibilidad
  - [ ] Retornar 201 con ReferenceNumber
- [ ] Endpoint `GET /api/appointments/{id}` [Authorize]
  - [ ] Solo usuario o business owner puede ver
- [ ] Endpoint `GET /api/appointments/my` [Authorize]
  - [ ] Listar citas del usuario autenticado
  - [ ] Filtros: ?status=Pending&from=2025-11-01&to=2025-11-30
- [ ] Endpoint `GET /api/businesses/{businessId}/appointments` [Authorize]
  - [ ] Solo business owner
  - [ ] Filtros por fecha, servicio, empleado
- [ ] Endpoint `PATCH /api/appointments/{id}/confirm` [Authorize]
  - [ ] Solo business owner
  - [ ] Cambiar status a Confirmed
- [ ] Endpoint `PATCH /api/appointments/{id}/cancel` [Authorize]
  - [ ] Usuario o business owner
  - [ ] Validar política de cancelación
  - [ ] Registrar razón
- [ ] Endpoint `PATCH /api/appointments/{id}/complete` [Authorize]
  - [ ] Solo business owner
  - [ ] Cambiar status a Completed
- [ ] Endpoint `PATCH /api/appointments/{id}/noshow` [Authorize]
  - [ ] Solo business owner
  - [ ] Incrementar TotalNoShows del usuario

### 3.8 Validadores de Citas
- [ ] Crear `CreateAppointmentDtoValidator`
  - [ ] ScheduledDate debe ser futura
  - [ ] ScheduledDate dentro de días permitidos
  - [ ] BusinessId, ServiceId válidos
- [ ] Validaciones de negocio en AppointmentService
  - [ ] Usuario no tenga más de X citas pendientes
  - [ ] Usuario no esté bloqueado por no-shows
  - [ ] Slot realmente disponible (double-check)

### 3.9 Pruebas de Citas
- [ ] Consultar disponibilidad de un servicio
- [ ] Crear cita en slot disponible
- [ ] Intentar crear cita en slot ocupado (409 Conflict)
- [ ] Confirmar cita como business owner
- [ ] Cancelar cita como usuario
- [ ] Intentar cancelar fuera de política (400 Bad Request)
- [ ] Marcar cita como completada
- [ ] Marcar no-show y verificar incremento en usuario

---

## Fase 4: Pagos con Wompi

### 4.1 Configuración de Wompi
- [ ] Crear cuenta en Wompi (Sandbox)
- [ ] Obtener credenciales (Public Key, Private Key)
- [ ] Agregar configuración en appsettings.json
  ```json
  "Wompi": {
    "PublicKey": "pub_test_xxx",
    "PrivateKey": "prv_test_xxx",
    "EventsSecret": "test_events_xxx",
    "BaseUrl": "https://sandbox.wompi.co"
  }
  ```

### 4.2 DTOs de Pagos
- [ ] Crear `Application/DTOs/Payment/CreatePaymentIntentDto`
  - [ ] AppointmentId, Amount, Currency, PaymentMethod
- [ ] Crear `PaymentDto`
  - [ ] Id, Reference, Amount, Status, PaymentMethod
- [ ] Crear `WompiWebhookDto`
  - [ ] Event, Data, Signature

### 4.3 Servicio de Wompi
- [ ] Crear `Application/Interfaces/IWompiService.cs`
  - [ ] CreateTransactionAsync
  - [ ] GetTransactionStatusAsync
  - [ ] ValidateWebhookSignature
- [ ] Crear `Infrastructure/Services/WompiService.cs`
  - [ ] Integrar con API de Wompi usando HttpClient
  - [ ] POST /v1/transactions
  - [ ] GET /v1/transactions/{id}
  - [ ] Validar firma de webhooks

### 4.4 Servicio de Pagos
- [ ] Crear `Application/Interfaces/IPaymentService.cs`
  - [ ] CreatePaymentIntentAsync
  - [ ] ProcessPaymentAsync
  - [ ] HandleWebhookAsync
- [ ] Crear `Application/Services/PaymentService.cs`
  - [ ] Crear WompiTransaction asociada a Appointment
  - [ ] Actualizar PaymentStatus de Appointment
  - [ ] Manejar estados: APPROVED, DECLINED, PENDING, ERROR

### 4.5 PaymentsController
- [ ] Crear `API/Controllers/PaymentsController.cs`
- [ ] Endpoint `POST /api/payments/intent` [Authorize]
  - [ ] Crear intención de pago para cita
  - [ ] Generar reference único
  - [ ] Llamar Wompi API
  - [ ] Retornar payment URL o token
- [ ] Endpoint `GET /api/payments/{appointmentId}/status` [Authorize]
  - [ ] Consultar estado del pago
- [ ] Endpoint `POST /api/payments/wompi/webhook` [AllowAnonymous]
  - [ ] Recibir notificaciones de Wompi
  - [ ] Validar firma HMAC
  - [ ] Actualizar estado de transacción y cita
  - [ ] Retornar 200 OK siempre (idempotencia)

### 4.6 Lógica de Depósitos
- [ ] Modificar CreateAppointment para verificar RequiresDeposit
- [ ] Si requiere depósito:
  - [ ] Status inicial = Pending (esperando pago)
  - [ ] Crear PaymentIntent automáticamente
  - [ ] Retornar payment URL en response
- [ ] Al recibir webhook APPROVED:
  - [ ] Cambiar status a Confirmed
  - [ ] Actualizar DepositAmount en Appointment

### 4.7 Pruebas de Pagos
- [ ] Crear cita que requiere depósito
- [ ] Verificar generación de payment intent
- [ ] Simular pago aprobado en Wompi Sandbox
- [ ] Verificar recepción de webhook
- [ ] Confirmar actualización de status de cita
- [ ] Simular pago declinado
- [ ] Verificar manejo de errores

---

## Fase 5: Reseñas y Reputación

### 5.1 DTOs de Reseñas
- [ ] Crear `Application/DTOs/Review/CreateReviewDto`
  - [ ] AppointmentId, Rating (1-5), Comment
- [ ] Crear `ReviewDto`
  - [ ] Incluir User info, Business info, Appointment reference
  - [ ] Response (respuesta del negocio)
- [ ] Crear `UpdateReviewResponseDto`
  - [ ] Response (solo business owner)

### 5.2 Servicios de Reseñas
- [ ] Crear `Core/Interfaces/IReviewRepository.cs`
  - [ ] GetByBusinessIdAsync
  - [ ] GetByUserIdAsync
  - [ ] GetAverageRatingAsync
- [ ] Crear `Infrastructure/Repositories/ReviewRepository.cs`
- [ ] Crear `Application/Interfaces/IReviewService.cs`
  - [ ] CreateAsync, UpdateResponseAsync
  - [ ] GetBusinessReviewsAsync
  - [ ] CalculateBusinessRatingAsync
- [ ] Crear `Application/Services/ReviewService.cs`
  - [ ] Validar que Appointment esté Completed
  - [ ] Validar que no exista review previa
  - [ ] Actualizar AverageRating y TotalReviews del Business
  - [ ] Actualizar AverageRating del User (como negocio)

### 5.3 ReviewsController
- [ ] Crear `API/Controllers/ReviewsController.cs`
- [ ] Endpoint `POST /api/reviews` [Authorize]
  - [ ] Crear reseña para cita completada
  - [ ] Validar que usuario sea el de la cita
- [ ] Endpoint `GET /api/businesses/{businessId}/reviews`
  - [ ] Listar reseñas con paginación
  - [ ] Ordenar por fecha (más recientes primero)
- [ ] Endpoint `PUT /api/reviews/{id}/response` [Authorize]
  - [ ] Solo business owner puede responder
  - [ ] Agregar Response a la reseña
- [ ] Endpoint `GET /api/users/my/reviews` [Authorize]
  - [ ] Mis reseñas como usuario

### 5.4 Sistema Anti No-Show
- [ ] Modificar lógica de marcar NoShow:
  - [ ] Incrementar User.TotalNoShows
  - [ ] Registrar en AuditLogs (futuro)
- [ ] Crear `Application/Interfaces/IReputationService.cs`
  - [ ] CalculateUserReputationAsync
  - [ ] IsUserBlocked
  - [ ] CanUserBookAsync
- [ ] Crear `Application/Services/ReputationService.cs`
  - [ ] Política: 3+ no-shows = bloqueo temporal
  - [ ] Requerir depósito obligatorio si 1-2 no-shows
  - [ ] Resetear contador cada X meses
- [ ] Integrar en CreateAppointment:
  - [ ] Validar reputación del usuario
  - [ ] Denegar si está bloqueado
  - [ ] Forzar depósito si tiene historial de no-shows

### 5.5 Pruebas de Reseñas y Reputación
- [ ] Completar cita y crear reseña
- [ ] Verificar actualización de rating del negocio
- [ ] Responder reseña como business owner
- [ ] Intentar crear reseña duplicada (400 Bad Request)
- [ ] Marcar 3 no-shows a un usuario
- [ ] Verificar bloqueo de usuario
- [ ] Intentar crear cita con usuario bloqueado (403 Forbidden)

---

## Fase 6: Características Avanzadas

### 6.1 Favoritos de Usuario
- [ ] Crear entidad `Core/Entities/UserFavorite.cs`
  - [ ] Id, UserId, BusinessId, CreatedAt
- [ ] Agregar migración
- [ ] Crear `Application/DTOs/Favorite/AddFavoriteDto`
- [ ] Crear `Application/Interfaces/IFavoriteService.cs`
- [ ] Crear `Application/Services/FavoriteService.cs`
- [ ] Endpoint `POST /api/users/favorites` [Authorize]
- [ ] Endpoint `DELETE /api/users/favorites/{businessId}` [Authorize]
- [ ] Endpoint `GET /api/users/my/favorites` [Authorize]

### 6.2 Notificaciones (Email básico)
- [ ] Configurar SMTP en appsettings.json
- [ ] Crear `Application/Interfaces/IEmailService.cs`
  - [ ] SendEmailAsync, SendAppointmentConfirmationAsync
  - [ ] SendAppointmentReminderAsync
- [ ] Crear `Infrastructure/Services/EmailService.cs`
  - [ ] Usar SmtpClient o SendGrid
- [ ] Enviar emails en eventos clave:
  - [ ] Registro de usuario
  - [ ] Cita creada
  - [ ] Cita confirmada
  - [ ] Recordatorio 24h antes
  - [ ] Cita cancelada

### 6.3 Búsqueda Avanzada
- [ ] Endpoint `GET /api/businesses/advanced-search`
  - [ ] Filtros: category, city, rating (min), priceRange
  - [ ] Ordenamiento: distance, rating, price
  - [ ] Paginación mejorada con cursor
- [ ] Crear índices en SQL Server para optimizar búsquedas
  ```sql
  CREATE INDEX IX_Businesses_City_Category_Rating 
  ON Businesses(City, Category, AverageRating DESC);
  ```

### 6.4 Dashboard de Negocio
- [ ] Endpoint `GET /api/businesses/{id}/dashboard` [Authorize]
  - [ ] Métricas: total citas, citas pendientes, completadas
  - [ ] Ingresos del mes
  - [ ] Rating promedio
  - [ ] Próximas citas
- [ ] Usar Dapper para queries optimizadas
- [ ] Crear `Application/DTOs/Dashboard/BusinessDashboardDto`

### 6.5 Historial de Citas
- [ ] Endpoint `GET /api/users/my/appointments/history`
  - [ ] Solo citas Completed o Cancelled
  - [ ] Paginación
  - [ ] Filtros por fecha, negocio

### 6.6 Sistema de Planes (Monetización)
- [ ] Crear entidad `Core/Entities/SubscriptionPlan.cs`
  - [ ] Name (Free, Basic, Premium), Price, Features (JSON)
- [ ] Agregar migración
- [ ] Modificar Business para limitar features según plan:
  - [ ] Free: 1 servicio, 2 empleados, 10 citas/mes
  - [ ] Basic: 5 servicios, 5 empleados, 100 citas/mes
  - [ ] Premium: Ilimitado
- [ ] Crear middleware/filter para validar límites
- [ ] Endpoint `POST /api/subscriptions/upgrade` [Authorize]

---

## Fase 7: Testing y Calidad

### 7.1 Unit Tests
- [ ] Crear proyecto `TurnoYa.Tests`
- [ ] Agregar paquetes: xUnit, Moq, FluentAssertions
- [ ] Tests de AuthService:
  - [ ] Register con datos válidos
  - [ ] Register con email duplicado
  - [ ] Login con credenciales correctas
  - [ ] Login con credenciales incorrectas
- [ ] Tests de AppointmentService:
  - [ ] CreateAppointment con slot disponible
  - [ ] CreateAppointment con slot ocupado
  - [ ] Cancel appointment dentro de política
  - [ ] Cancel appointment fuera de política
- [ ] Tests de ReputationService:
  - [ ] Usuario bloqueado con 3+ no-shows
  - [ ] Usuario requiere depósito con 1-2 no-shows
- [ ] Ejecutar: `dotnet test`

### 7.2 Integration Tests
- [ ] Configurar TestServer de ASP.NET Core
- [ ] Tests de endpoints:
  - [ ] POST /api/auth/register → 201
  - [ ] POST /api/auth/login → 200 con token
  - [ ] GET /api/businesses/nearby → 200 con datos
  - [ ] POST /api/appointments (sin auth) → 401
  - [ ] POST /api/appointments (con auth) → 201
- [ ] Usar base de datos in-memory (SQLite)

### 7.3 Validación de Modelos
- [ ] Revisar todos los DTOs tienen validadores
- [ ] Probar validaciones en Swagger
- [ ] Verificar mensajes de error claros y en español

### 7.4 Logging y Auditoría
- [ ] Crear entidad `Core/Entities/AuditLog.cs`
  - [ ] EntityName, EntityId, Action, ChangedBy, OldValues, NewValues
- [ ] Agregar migración
- [ ] Crear interceptor EF Core para auditoría automática
- [ ] Registrar eventos críticos:
  - [ ] Login exitoso/fallido
  - [ ] Creación/Cancelación de citas
  - [ ] Cambios en estado de citas
  - [ ] Pagos aprobados/declinados

### 7.5 Manejo de Errores Global
- [ ] Crear `API/Middleware/ExceptionHandlerMiddleware.cs`
- [ ] Capturar excepciones no controladas
- [ ] Retornar respuesta consistente:
  ```json
  {
    "success": false,
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "Ocurrió un error inesperado",
      "details": []
    },
    "meta": { "correlationId": "xxx", "timestamp": "..." }
  }
  ```
- [ ] Loggear excepciones con Serilog
- [ ] Registrar middleware en Program.cs

---

## Fase 8: Optimización y Producción

### 8.1 Performance
- [ ] Agregar índices faltantes en base de datos
- [ ] Implementar paginación en todos los listados
- [ ] Usar AsNoTracking() en queries de lectura
- [ ] Implementar caching con IMemoryCache:
  - [ ] Lista de negocios por ciudad (5 min)
  - [ ] Disponibilidad de slots (2 min)
  - [ ] Rating de negocios (10 min)

### 8.2 Seguridad
- [ ] Cambiar JWT Secret en producción (64+ caracteres)
- [ ] Configurar CORS para dominios específicos
  ```csharp
  builder.Services.AddCors(options => {
    options.AddPolicy("Production", policy => {
      policy.WithOrigins("https://turnoya.com", "https://www.turnoya.com")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
  });
  ```
- [ ] Implementar rate limiting con AspNetCoreRateLimit
  - [ ] Login: 5 intentos / 15 min
  - [ ] Register: 3 intentos / hora
  - [ ] Appointments: 20 / hora
- [ ] Habilitar HTTPS redirect obligatorio
- [ ] Configurar políticas de contraseñas fuertes
- [ ] Sanitizar logs (no exponer datos sensibles)
- [ ] Implementar HSTS (HTTP Strict Transport Security)

### 8.3 Documentación API
- [ ] Mejorar descrición de endpoints en Swagger
- [ ] Agregar ejemplos de request/response
- [ ] Documentar códigos de error
- [ ] Agregar autenticación JWT en Swagger UI
  ```csharp
  services.AddSwaggerGen(c => {
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
      // configuración JWT
    });
  });
  ```
- [ ] Exportar especificación OpenAPI
- [ ] Crear Postman Collection

### 8.4 Configuración de Entornos
- [ ] Crear `appsettings.Production.json`
  - [ ] Connection string segura (Azure SQL / AWS RDS)
  - [ ] JWT secret seguro
  - [ ] Wompi credenciales de producción
  - [ ] SMTP de producción (SendGrid)
- [ ] Configurar secretos con Azure Key Vault / AWS Secrets Manager
- [ ] Variables de entorno para CI/CD

### 8.5 Health Checks Avanzados
- [ ] Agregar health check de base de datos
- [ ] Agregar health check de Wompi API
- [ ] Agregar health check de SMTP
- [ ] Endpoint `/health/ready` (listo para recibir tráfico)
- [ ] Endpoint `/health/live` (aplicación viva)
- [ ] Integrar con Application Insights / CloudWatch

### 8.6 Background Jobs
- [ ] Instalar Hangfire o Quartz.NET
- [ ] Job: Enviar recordatorios de citas (24h antes)
  - [ ] Ejecutar cada hora
  - [ ] Buscar citas del día siguiente
  - [ ] Enviar email de recordatorio
- [ ] Job: Limpiar refresh tokens expirados (diario)
- [ ] Job: Calcular métricas de negocios (cada 6 horas)
- [ ] Job: Resetear contadores de no-shows (mensual)

### 8.7 Deployment
- [ ] Crear Dockerfile optimizado (multi-stage build)
- [ ] Crear docker-compose.yml (API + SQL Server)
- [ ] Configurar CI/CD pipeline:
  - [ ] GitHub Actions / Azure DevOps / GitLab CI
  - [ ] Build automático en push a main
  - [ ] Ejecutar tests
  - [ ] Build imagen Docker
  - [ ] Push a registry (Docker Hub / ACR / ECR)
  - [ ] Deploy a staging automático
  - [ ] Deploy a producción manual
- [ ] Desplegar en:
  - [ ] Azure App Service / Container Apps
  - [ ] AWS ECS / Elastic Beanstalk
  - [ ] Heroku / Railway
  - [ ] VPS con Docker

### 8.8 Monitoring
- [ ] Configurar Application Insights (Azure)
- [ ] Configurar CloudWatch (AWS)
- [ ] Configurar Serilog para enviar logs a:
  - [ ] Seq (self-hosted)
  - [ ] Elasticsearch + Kibana
  - [ ] Azure Log Analytics
- [ ] Métricas a monitorear:
  - [ ] Request rate, error rate, latency
  - [ ] Database connection pool
  - [ ] CPU y memoria
  - [ ] Tasa de citas creadas/canceladas
  - [ ] Tasa de pagos aprobados/declinados
- [ ] Configurar alertas:
  - [ ] Error rate > 5%
  - [ ] Latency P95 > 2s
  - [ ] Database connections exhausted

---

## 📊 Resumen de Progreso

### Estado General
```
Total de tareas: ~250+
Completadas: 32
En progreso: 0
Pendientes: 218+
Progreso: ~13%
```

### Próximos Pasos Inmediatos
1. Completar DTOs de autenticación
2. Implementar TokenService
3. Implementar AuthService
4. Crear AuthController
5. Probar registro y login

---

## 🎯 Notas Importantes

### Convenciones
- Todos los endpoints deben retornar respuesta consistente:
  ```json
  {
    "success": true,
    "data": { /* payload */ },
    "error": null,
    "meta": { "timestamp": "...", "correlationId": "..." }
  }
  ```
- Fechas siempre en UTC (ISO 8601)
- Paginación: `?page=1&pageSize=20` + header `X-Total-Count`
- Filtros: query params específicos, no query genérico
- Ordenamiento: `?sort=-createdAt` (prefijo `-` = DESC)

### Commits
- Usar conventional commits:
  - `feat: agregar endpoint de registro`
  - `fix: corregir validación de email`
  - `refactor: extraer lógica de disponibilidad a servicio`
  - `test: agregar tests de AppointmentService`
  - `docs: actualizar README con instrucciones de deployment`

### Prioridades
1. **Alta**: Fases 1-3 (Autenticación, Negocios, Citas)
2. **Media**: Fases 4-5 (Pagos, Reseñas)
3. **Baja**: Fase 6 (Características avanzadas)
4. **Continua**: Fases 7-8 (Testing, Optimización)

---

**Última actualización**: 25 de noviembre de 2025  
**Versión del checklist**: 1.0

¡Buena suerte con el desarrollo! 🚀
