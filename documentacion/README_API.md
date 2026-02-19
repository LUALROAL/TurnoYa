# TurnoYa Backend API

> ⚠️ **Actualización importante**
>
> Este documento tiene secciones desactualizadas (por ejemplo referencias a `/health` y roadmap antiguo).
>
> La referencia técnica actualizada (análisis backend real + roadmap frontend) está en:
>
> **`FASE1_ANALISIS_Y_FASE2_ROADMAP_FRONTEND.md`**

API REST construida con .NET 8 + SQL Server para el sistema de gestión de citas TurnoYa.

## Arquitectura

**Clean Architecture + DDD Light**

```
TurnoYa.API          → Presentation (Controllers, Middleware)
TurnoYa.Application  → Application Logic (Use Cases, DTOs)
TurnoYa.Core         → Domain (Entities, Interfaces, Enums)
TurnoYa.Infrastructure → Data Access (EF Core, Repositories)
```

## Requisitos

- .NET 8 SDK
- SQL Server (local)
- Base de datos `TurnoyaDB` (debe existir)

## Comandos Rápidos

### Compilar
```bash
dotnet build TurnoYa.sln
```

### Ejecutar API
```bash
dotnet run --project TurnoYa.API
```

La API estará disponible en: `http://localhost:5185`

### Endpoints Disponibles

- **Health Check**: `GET /health` - Verifica estado de la API y conectividad de BD
- **Swagger UI**: `http://localhost:5185/swagger` - Documentación interactiva de la API

### Migraciones

```bash
# Listar migraciones
dotnet ef migrations list -p TurnoYa.Infrastructure -s TurnoYa.API

# Crear nueva migración
dotnet ef migrations add NombreMigracion -p TurnoYa.Infrastructure -s TurnoYa.API

# Aplicar migraciones
dotnet ef database update -p TurnoYa.Infrastructure -s TurnoYa.API
```

## Estado del Proyecto

✅ Solución creada con 4 proyectos (API, Core, Infrastructure, Application)  
✅ Entidades de dominio definidas (User, Business, Service, Appointment, etc.)  
✅ ApplicationDbContext configurado con relaciones y precisión de datos  
✅ Migración baseline aplicada (sincronizada con BD existente)  
✅ Autenticación JWT configurada  
✅ Logging con Serilog  
✅ Validación con FluentValidation  
✅ AutoMapper configurado  
✅ Health check endpoint funcional  

## Configuración

Revisa `TurnoYa.API/appsettings.json`:

- **ConnectionStrings:DefaultConnection**: Cadena de conexión a TurnoyaDB
- **Jwt:Secret**: ⚠️ Reemplazar con secreto seguro de 32+ caracteres para producción

## Documentación Técnica

Ver `docs/Backend_NET.md` para:
- Arquitectura detallada en N capas
- Modelo de datos SQL Server
- Estrategia de migraciones
- Diseño de API REST
- Seguridad y cumplimiento
- Testing y calidad
- CI/CD y roadmap

## Próximos Pasos

1. Implementar endpoints de autenticación (`/auth/register`, `/auth/login`)
2. CRUD de negocios y servicios
3. Lógica de disponibilidad de citas
4. Integración con Wompi (pagos)
5. Sistema de reseñas y reputación
