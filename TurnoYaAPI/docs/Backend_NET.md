# TurnoYa Backend (.NET 8 + SQL Server)

> Documentación profesional para la API y capa de datos de TurnoYa. Incluye arquitectura en capas, esquema relacional optimizado, convenciones, seguridad, endpoints, testing, CI/CD y roadmap técnico.

## Tabla de Contenidos
1. Visión General
2. Principios y Objetivos
3. Arquitectura en Capas (Clean + DDD Light)
4. Modelo de Datos SQL Server
5. Estrategia de Migraciones y Versionado DB
6. Diseño de la API REST
7. Seguridad y Cumplimiento
8. Performance y Escalabilidad
9. Testing y Calidad
10. Observabilidad y Logging
11. CI/CD y Entornos
12. Roadmap Técnico Refinado
13. Checklist de Entrega por Fase
14. Próximos Pasos Inmediatos

---
## 1. Visión General
Backend que orquesta reservas, pagos (Wompi), reputación anti no-show y analítica básica. Debe ser escalable, seguro, extensible y auditable.

---
## 2. Principios y Objetivos
- Separación estricta de responsabilidades por capa.
- Código predecible: patrones consistentes (Repository + Services + DTOs).
- Evitar *anémico* Domain: entidades con lógica mínima (validaciones de invariantes simples).
- Compatibilidad multi-cliente (web, móvil híbrido, futura API pública).
- Observabilidad desde el día 1 (correlación de requests y eventos de negocio).
- Preparado para monetización (planes, comisión, límites).

---
## 3. Arquitectura en Capas (Clean + DDD Light)

| Capa | Proyecto | Responsabilidad | Dependencias |
|------|----------|-----------------|--------------|
| Presentation | `TurnoYa.API` | Endpoints REST, filtros, middleware | Application |
| Application | `TurnoYa.Application` (recomendado extra) | Casos de uso, orquestación, DTOs, validaciones | Domain, Infrastructure(interfaces) |
| Domain | `TurnoYa.Core` | Entidades, Value Objects, Enums, Interfaces repos | Ninguna externa |
| Infrastructure | `TurnoYa.Infrastructure` | EF Core, Dapper, Repos, Integraciones (Wompi, Maps, Storage) | Domain |
| CrossCutting | (dentro de Infrastructure/Core) | Logging, Caching, Mappers, Eventos | Domain |

Flujo: Controller -> Handler/Service Application -> Repository -> DB / External Service -> regreso con Result DTO.

Patrones recomendados:
- Command/Query separados (CQRS liviano) para escalar lecturas.
- Value Objects (ej: `Money`, `GeoPoint`).
- Result wrapper (éxito/errores) interno para evitar excepciones de control de flujo.

---
## 4. Modelo de Datos SQL Server
Extiende el esquema base entregado para cubrir métricas, favoritos, métodos de pago y auditoría.

### Nuevas tablas sugeridas
- `UserFavorites` (favoritos de negocios)
- `UserPaymentMethods` (tokenización Wompi, últimos 4 dígitos)
- `EmployeeSchedules` (franjas específicas por empleado)
- `AuditLogs` (cambios críticos: estado citas, bloqueos usuario, pagos)
- `BackgroundJobs` (cola simple para reintentos webhooks, recordatorios)

### Convenciones
- PK: `UNIQUEIDENTIFIER` con `NEWSEQUENTIALID()` para reducir fragmentación.
- Fechas UTC (`DATETIME2`) + conversión en frontend.
- Índices compuestos para búsquedas frecuentes.
- Evitar NVARCHAR(MAX) salvo JSON o grandes comentarios; normalizar si crece.

```sql
-- Ejemplo de tablas adicionales
CREATE TABLE UserFavorites (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    BusinessId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Businesses(Id),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE(UserId, BusinessId)
);

CREATE TABLE UserPaymentMethods (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Type NVARCHAR(20) NOT NULL CHECK (Type IN ('Card','Nequi','Daviplata','PSE')),
    MaskedNumber NVARCHAR(30),
    WompiToken NVARCHAR(200) NOT NULL,
    IsDefault BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE EmployeeSchedules (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    EmployeeId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Employees(Id),
    DayOfWeek INT NOT NULL CHECK (DayOfWeek BETWEEN 0 AND 6),
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE(EmployeeId, DayOfWeek, StartTime, EndTime)
);

CREATE TABLE AuditLogs (
    Id BIGINT IDENTITY PRIMARY KEY,
    EntityName NVARCHAR(100) NOT NULL,
    EntityId NVARCHAR(100) NOT NULL,
    Action NVARCHAR(50) NOT NULL,
    ChangedBy NVARCHAR(100) NOT NULL,
    OldValues NVARCHAR(MAX),
    NewValues NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    CorrelationId NVARCHAR(100)
);

CREATE INDEX IX_AuditLogs_Entity ON AuditLogs(EntityName, EntityId);
```

### Índices estratégicos
- `Appointments (BusinessId, ScheduledDate)` para agenda.
- `Businesses (City, Category)` para búsquedas.
- `Services (BusinessId, IsActive)`.
- `Reviews (BusinessId, Rating)`.

### Integridad
- ON DELETE RESTRICT en la mayoría; limpieza lógica (soft delete) para históricos.
- Revisar FKs para cascada solo en datos secundarios (ej: `BusinessSettings`).

---
## 5. Estrategia de Migraciones y Versionado DB
- Uso de EF Core Migrations (`Add-Migration <name>`).
- Convención de nombres: `yyyyMMddHHmm_Description`.
- Script automático para CI: `dotnet ef migrations bundle` (si aplica).
- Versionar SQL crítico adicional (procedures, funciones) en `db/scripts`.
- Auditoría de cambios: registrar en `AuditLogs` mediante interceptor EF.

---
## 6. Diseño de la API REST
### Convenciones
- Base URL: `https://api.turnoya.com/v1/`.
- Versionado por ruta (`/v1`) + semántica (rompientes -> nueva versión).
- Respuesta estándar:
```json
{
  "success": true,
  "data": { },
  "error": null,
  "meta": { "correlationId": "...", "timestamp": "..." }
}
```
- Paginación: `?page=1&pageSize=20` + encabezados `X-Total-Count`.
- Filtros: campos específicos `?city=Bogota&category=Barber&radiusKm=5`.
- Orden: `?sort=-createdAt`.
- Idempotencia: usar `ReferenceNumber` en creación de citas + token idempotencia opcional.

### Endpoints clave (resumen)
| Recurso | Método | Ruta | Descripción |
|---------|--------|------|-------------|
| Auth | POST | `/auth/register` | Registro usuario |
| Auth | POST | `/auth/login` | Login JWT |
| Users | GET | `/users/me` | Perfil actual |
| Businesses | GET | `/businesses/nearby` | Búsqueda geolocalizada |
| Appointments | POST | `/appointments` | Crear cita |
| Appointments | GET | `/appointments/{id}` | Obtener cita |
| Payments | POST | `/payments/wompi/transaction` | Crear transacción |
| Payments | POST | `/payments/wompi/webhook` | Webhook Wompi |
| Reviews | POST | `/reviews` | Crear reseña |

### Errores
- HTTP Codes: 200/201 éxito, 400 validación, 401 auth, 403 permisos, 404 no encontrado, 409 conflicto, 422 reglas negocio, 500 interno.
- Mensajes estructurados: `code`, `message`, `details[]`.

### Validación
- FluentValidation para DTOs.
- Filtro global de validación -> responde 400 con listado.

---
## 7. Seguridad y Cumplimiento
- JWT firmado HS256 + refresh tokens con rotación y revocación (tabla `UserRefreshTokens`).
- Password hashing: ASP.NET Identity (PBKDF2).
- Rate limiting (ASP.NET middleware / YARP) para endpoints críticos (`/auth/*`, `/payments/*`).
- CORS restrictivo (orígenes de producción).
- Logging sin datos sensibles (no guardar tokens ni números completos de tarjeta).
- Protección de DoS: tamaño máximo de payload + cancelación de request si excede tiempo.
- Registros de seguridad en `AuditLogs` (login fallido, bloqueo usuario).

---
## 8. Performance y Escalabilidad
- Caching Redis para listas de negocios, disponibilidad de horarios calculada.
- Pre-cálculo de slots (background job cada X minutos).
- Dapper para queries analíticas pesadas (ej: dashboard negocio).
- Carga diferida (lazy vs eager) controlada: incluir explícito en repos.
- Compresión HTTP (gzip/brotli).
- Posible CQRS futuro: separar lectura en `TurnoYa.ReadModel`.
- Background jobs con `Hangfire` o `Quartz.NET` (recordatorios, limpieza no-shows).

---
## 9. Testing y Calidad
| Tipo | Herramienta | Alcance |
|------|-------------|---------|
| Unit | xUnit | Servicios y lógica negocio |
| Integration | xUnit + Testcontainers | Repos + Webhooks |
| Contract | `FluentAssertions` + Snapshots | Formato respuestas |
| Performance | `k6` (externo) | Carga endpoints críticos |
| Security | `OWASP ZAP` (pipeline) | Escaneo básico |

- Estrategia mocks: Interfaces (repos, WompiService) con `Moq`.
- Cobertura objetivo inicial: 60% -> 80% en evolución.

---
## 10. Observabilidad y Logging
- `Serilog` + sinks: Console, Seq/Elastic.
- CorrelationId middleware: header `X-Correlation-Id` (si no, generar GUID).
- Métricas Prometheus (si en contenedores) / Azure AppInsights.
- Eventos dominio (cita creada, pago aprobado) -> log nivel `Information` + métricas contadores.

---
## 11. CI/CD y Entornos
### Pipeline (GitHub Actions ejemplo)
1. Trigger: push/pull_request main/develop.
2. Jobs: `build`, `test`, `sonar`, `docker build`, `deploy-dev`.
3. Artefactos: imagen Docker etiquetada `api:<git-sha>`.

### Entornos
| Entorno | Objetivo | Particularidades |
|---------|----------|------------------|
| Dev | Desarrollo rápido | Semillas + logs verbosos |
| Staging | Pre-producción | Datos casi reales, pruebas carga |
| Prod | Usuarios finales | Alertas + escalado autos |

### Despliegue
- Infra: App Service / Container Apps / ECS.
- Estrategia: Rolling / Blue-Green para cambios críticos.
- Rollback: conservar últimas 3 imágenes.

---
## 12. Roadmap Técnico Refinado
Fase | Objetivo | Entregables
-----|----------|------------
1 | Fundaciones | Solución, DB, Auth, Migraciones iniciales
2 | Núcleo Reservas | Services + lógica disponibilidad + pagos sandbox
3 | Anti No-Show + Reviews | Reputación, depósitos, reseñas moderación
4 | Observabilidad + Escala | Caching, métricas, optimizaciones queries
5 | Monetización avanzada | Planes, límites, facturación interna
6 | Preparación API Pública | Hardening seguridad, rate limiting granular

---
## 13. Checklist de Entrega por Fase
### Fase 1
- [ ] Solución .NET creada
- [ ] Migraciones iniciales aplicadas
- [ ] JWT + Refresh tokens funcional
- [ ] Health endpoint `/health`

### Fase 2
- [ ] Endpoints reservas CRUD base
- [ ] Lógica disponibilidad validada
- [ ] Wompi sandbox transacción y webhook
- [ ] Tests unit servicios (mín 10 casos)

### Fase 3
- [ ] Sistema reputación (no-shows)
- [ ] Depósitos y bloqueo automático
- [ ] Reviews con moderación
- [ ] Métricas básicas negocio

### Fase 4
- [ ] Redis caching configurado
- [ ] Logs estructurados + CorrelationId
- [ ] Panel análisis (queries optimizadas)

### Fase 5
- [ ] Planes suscripción aplican límites
- [ ] Comisión transacciones registrada

### Fase 6
- [ ] Rate limiting refinado
- [ ] Documentación OpenAPI pública limpia

---
## 14. Próximos Pasos Inmediatos
1. Crear proyecto adicional `TurnoYa.Application` para separar lógica (si no existe).
2. Implementar tablas adicionales críticas (`UserFavorites`, `UserPaymentMethods`).
3. Agregar migración inicial y aplicar en Dev.
4. Implementar Auth (register/login/refresh) + endpoints `/auth`.
5. Crear servicio de disponibilidad para citas (cálculo de slots).
6. Integrar Wompi sandbox (transacción + webhook validación firma).
7. Configurar Serilog + CorrelationId middleware.
8. Pipeline CI básico (build + test + docker push).

---
### Notas Finales
- Mantener separación DTOs / Entidades para evitar fuga de modelo interno.
- Registrar todas transiciones estado de cita en `AppointmentStatusHistory` y `AuditLogs`.
- Revisión mensual de índices y planes de ejecución.

---

> ¿Deseas también un script `.sql` consolidado o la definición de DTOs iniciales? Pídelo y lo agrego en otra sección.

---
## Quick Start (Comandos Básicos)

```bash
# Restaurar dependencias y compilar
dotnet restore
dotnet build

# Ejecutar API (puerto dinámico HTTPS)
dotnet run --project TurnoYa.API

# Ejecución con hot reload
dotnet watch run --project TurnoYa.API

# Listar migraciones registradas
dotnet ef migrations list -p TurnoYa.Infrastructure -s TurnoYa.API

# Crear nueva migración (ejemplo cambio en modelo)
dotnet ef migrations add 20251124_AgregarUserFavorites -p TurnoYa.Infrastructure -s TurnoYa.API

# Aplicar migraciones pendientes
dotnet ef database update -p TurnoYa.Infrastructure -s TurnoYa.API

# Crear script SQL (opcional para revisión)
dotnet ef migrations script -p TurnoYa.Infrastructure -s TurnoYa.API -o migration.sql

# Ejecutar tests (cuando existan proyectos de pruebas)
dotnet test
```

### Health Check Manual
Una vez ejecutada la API visita: `https://localhost:<puerto>/health` para validar que el servicio y la conexión a la base de datos responden correctamente.

### Notas
- Las migraciones se ejecutan desde el proyecto de infraestructura (`-p`) apuntando al startup (`-s`).
- Mantener convención de nombres de migraciones: `yyyyMMddHHmm_Descripcion`.
- Para entornos CI usar `dotnet ef migrations script` antes de aplicar en producción si se requiere aprobación manual.
