# TurnoYa Backend - Documentación Técnica Completa

> Documentación exhaustiva del backend de TurnoYa: arquitectura, tecnologías, estructura de carpetas, conceptos técnicos y guías de ejecución local.

---

## 📋 Tabla de Contenidos

1. [Información General](#información-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Conceptos Técnicos Clave](#conceptos-técnicos-clave)
6. [Modelo de Datos](#modelo-de-datos)
7. [Configuración del Proyecto](#configuración-del-proyecto)
8. [Ejecución en Local](#ejecución-en-local)
9. [Comandos Útiles](#comandos-útiles)
10. [Troubleshooting](#troubleshooting)

---

## 📌 Información General

**TurnoYa Backend** es una API REST construida con .NET 8 y SQL Server diseñada para gestionar un sistema completo de reservas de citas para negocios locales. El backend maneja usuarios, negocios, servicios, empleados, citas, pagos (Wompi), reseñas y reputación anti no-show.

### Características Principales

- ✅ Autenticación JWT con refresh tokens
- ✅ Clean Architecture + DDD Light
- ✅ Entity Framework Core 8 con migraciones
- ✅ Logging estructurado con Serilog
- ✅ Validación con FluentValidation
- ✅ Mapeo con AutoMapper
- ✅ Documentación con Swagger/OpenAPI
- ✅ Health checks para monitoreo
- ✅ Integración con Wompi (pagos)

---

## 🛠️ Stack Tecnológico

### Core Framework
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **.NET SDK** | 8.0 | Framework principal |
| **ASP.NET Core** | 8.0 | Web API framework |
| **C#** | 12 | Lenguaje de programación |

### Base de Datos
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **SQL Server** | 2019+ | Base de datos relacional |
| **Entity Framework Core** | 8.0.7 | ORM (Object-Relational Mapping) |
| **Dapper** | 2.1.35 | Micro-ORM para queries optimizadas |

### Librerías y Paquetes NuGet

#### TurnoYa.API (Presentation Layer)
```xml
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.8" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.3" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.7" />
<PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
<PackageReference Include="FluentValidation.AspNetCore" Version="11.3.1" />
<PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.1" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="10.0.1" />
```

#### TurnoYa.Infrastructure (Data Layer)
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.7" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.7" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.7" />
<PackageReference Include="Dapper" Version="2.1.35" />
```

#### TurnoYa.Application (Business Logic)
```xml
<PackageReference Include="AutoMapper" Version="12.0.1" />
<PackageReference Include="FluentValidation" Version="11.3.0" />
```

#### TurnoYa.Core (Domain Layer)
- Sin dependencias externas (Domain puro)

---

## 🏗️ Arquitectura del Sistema

### Clean Architecture + DDD Light

El proyecto sigue los principios de **Clean Architecture** (arquitectura limpia) combinados con **Domain-Driven Design ligero**, garantizando separación de responsabilidades y alta mantenibilidad.

```
┌─────────────────────────────────────────────────────────┐
│                    TurnoYa.API                          │
│              (Presentation Layer)                       │
│  Controllers, Middleware, Filters, DTOs Request         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                TurnoYa.Application                      │
│              (Application Layer)                        │
│  Use Cases, Services, DTOs, Validators, Mappings        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  TurnoYa.Core                           │
│                (Domain Layer)                           │
│  Entities, Value Objects, Enums, Interfaces             │
└─────────────────────────────────────────────────────────┘
                 ▲
                 │
┌────────────────┴────────────────────────────────────────┐
│              TurnoYa.Infrastructure                     │
│              (Infrastructure Layer)                     │
│  DbContext, Repositories, Migrations, External Services │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Request → Controller → Application Service → Domain Logic → Repository → Database
                                                                ↓
Response ← Controller ← DTO Mapping ← Business Logic ← Entity ← DbContext
```

### Principios Aplicados

- **Dependency Inversion**: Las capas superiores no dependen de implementaciones concretas
- **Single Responsibility**: Cada clase tiene una única razón para cambiar
- **Open/Closed**: Abierto a extensión, cerrado a modificación
- **Separation of Concerns**: Cada capa tiene responsabilidades bien definidas
- **Domain-Centric**: El dominio (Core) es el centro, sin dependencias externas

---

## 📁 Estructura de Carpetas

### Vista General

```
TurnoYaAPI/
├── TurnoYa.sln                          # Archivo de solución
├── README_API.md                        # Guía rápida
├── BACKEND_DOCUMENTATION.md             # Esta documentación
├── docs/
│   └── Backend_NET.md                   # Documentación arquitectónica detallada
│
├── TurnoYa.API/                         # 🎯 Capa de Presentación
│   ├── Controllers/
│   │   └── HealthController.cs          # Health check endpoint
│   ├── Properties/
│   │   └── launchSettings.json          # Configuración de ejecución
│   ├── Program.cs                       # Punto de entrada de la aplicación
│   ├── appsettings.json                 # Configuración principal
│   ├── appsettings.Development.json     # Configuración de desarrollo
│   └── TurnoYa.API.csproj              # Archivo de proyecto
│
├── TurnoYa.Core/                        # 🧠 Capa de Dominio
│   ├── Entities/
│   │   ├── BaseEntity.cs                # Entidad base con Id, CreatedAt, UpdatedAt
│   │   ├── User.cs                      # Usuario del sistema
│   │   ├── Business.cs                  # Negocio/Empresa
│   │   ├── Service.cs                   # Servicio ofrecido por negocio
│   │   ├── Employee.cs                  # Empleado de negocio
│   │   ├── Appointment.cs               # Cita/Reserva
│   │   ├── AppointmentStatusHistory.cs  # Historial de estados de cita
│   │   ├── BusinessSettings.cs          # Configuración de negocio
│   │   ├── Review.cs                    # Reseña/Calificación
│   │   └── WompiTransaction.cs          # Transacción de pago Wompi
│   └── TurnoYa.Core.csproj
│
├── TurnoYa.Infrastructure/              # 💾 Capa de Infraestructura
│   ├── Data/
│   │   ├── ApplicationDbContext.cs      # DbContext principal
│   │   └── Migrations/                  # Migraciones EF Core
│   │       ├── 20251124234349_BaselineInitial.cs
│   │       ├── 20251124234349_BaselineInitial.Designer.cs
│   │       └── ApplicationDbContextModelSnapshot.cs
│   └── TurnoYa.Infrastructure.csproj
│
└── TurnoYa.Application/                 # 📦 Capa de Aplicación
    ├── Class1.cs                        # Placeholder (futuro: Services, DTOs)
    └── TurnoYa.Application.csproj
```

### Descripción de Capas

#### 🎯 **TurnoYa.API** (Presentation)
**Responsabilidad**: Exponer endpoints HTTP, manejar autenticación, validar requests, formatear responses.

**Contiene**:
- **Controllers**: Endpoints REST (ej: `HealthController`, futuros `AuthController`, `BusinessController`)
- **Middleware**: Autenticación JWT, manejo de errores, logging
- **Filters**: Validación global, excepciones
- **Program.cs**: Configuración de DI, middleware pipeline, servicios

**Dependencias**: `Application`, `Infrastructure`

#### 🧠 **TurnoYa.Core** (Domain)
**Responsabilidad**: Lógica de negocio pura, entidades, reglas de dominio.

**Contiene**:
- **Entities**: Modelos de dominio con propiedades y relaciones
- **Enums**: Estados (ej: `AppointmentStatus`, `PaymentStatus`)
- **Interfaces**: Contratos de repositorios (futuro)
- **Value Objects**: Objetos inmutables (futuro: `Money`, `GeoPoint`)

**Dependencias**: **Ninguna** (dominio puro)

#### 💾 **TurnoYa.Infrastructure** (Data Access)
**Responsabilidad**: Persistencia de datos, acceso a base de datos, servicios externos.

**Contiene**:
- **ApplicationDbContext**: Configuración EF Core, DbSets, relaciones
- **Migrations**: Historial de cambios de esquema de BD
- **Repositories**: Implementaciones de acceso a datos (futuro)
- **External Services**: Integración Wompi, Google Maps, etc. (futuro)

**Dependencias**: `Core`

#### 📦 **TurnoYa.Application** (Business Logic)
**Responsabilidad**: Casos de uso, orquestación, validaciones de negocio, transformaciones DTO.

**Contiene** (futuro):
- **Services**: Lógica de aplicación (ej: `AppointmentService`, `PaymentService`)
- **DTOs**: Data Transfer Objects para requests/responses
- **Validators**: FluentValidation rules
- **Mappings**: Perfiles de AutoMapper

**Dependencias**: `Core`

---

## 💡 Conceptos Técnicos Clave

### 1. Clean Architecture

**¿Qué es?**
Patrón arquitectónico que separa el código en capas concéntricas, donde las capas internas (dominio) no conocen las externas (infraestructura).

**Beneficios**:
- ✅ Testabilidad: Lógica de negocio independiente de frameworks
- ✅ Mantenibilidad: Cambios aislados por capa
- ✅ Escalabilidad: Fácil agregar nuevas features sin romper existentes
- ✅ Flexibilidad: Cambiar BD o frameworks sin afectar dominio

### 2. Entity Framework Core (EF Core)

**¿Qué es?**
ORM (Object-Relational Mapper) que permite trabajar con bases de datos usando objetos C# en lugar de SQL directo.

**Características en TurnoYa**:
- **Code First**: Las entidades C# definen el esquema de BD
- **Migraciones**: Control de versiones del esquema
- **Lazy Loading**: Desactivado (mejor performance)
- **Change Tracking**: Detecta cambios automáticamente
- **Fluent API**: Configuración avanzada de relaciones en `OnModelCreating`

**Ejemplo de configuración**:
```csharp
modelBuilder.Entity<Business>(e =>
{
    e.HasOne(b => b.Owner)
     .WithMany(u => u.OwnedBusinesses)
     .HasForeignKey(b => b.OwnerId)
     .OnDelete(DeleteBehavior.Restrict);
    
    e.Property(p => p.AverageRating).HasPrecision(3,2);
    e.Property(p => p.Latitude).HasPrecision(10,7);
    e.Property(p => p.Longitude).HasPrecision(10,7);
});
```

### 3. Dependency Injection (DI)

**¿Qué es?**
Patrón de diseño donde los objetos reciben sus dependencias desde el exterior en lugar de crearlas internamente.

**Configuración en TurnoYa** (`Program.cs`):
```csharp
// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// Autenticación JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* configuración */ });

// Controllers
builder.Services.AddControllers();
```

**Beneficios**:
- Código desacoplado y testeable
- Fácil intercambio de implementaciones
- Gestión automática del ciclo de vida de objetos

### 4. JWT (JSON Web Tokens)

**¿Qué es?**
Estándar para transmitir información de forma segura entre cliente y servidor como un objeto JSON firmado.

**Flujo de autenticación**:
```
1. Cliente → POST /auth/login (email, password)
2. Servidor → Valida credenciales
3. Servidor → Genera JWT firmado
4. Servidor → Response { "token": "eyJhbG..." }
5. Cliente → Guarda token (localStorage/secure storage)
6. Cliente → Requests con header: Authorization: Bearer <token>
7. Servidor → Valida firma y expiración del token
8. Servidor → Permite/Deniega acceso
```

**Configuración en appsettings.json**:
```json
"Jwt": {
  "Issuer": "TurnoYaIssuer",
  "Audience": "TurnoYaAudience",
  "Secret": "REEMPLAZAR_CON_SECRETO_SEGUR0_MAYOR_32_CHARS"
}
```

### 5. Serilog (Structured Logging)

**¿Qué es?**
Biblioteca de logging que permite registrar eventos estructurados con contexto rico.

**Configuración**:
```csharp
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console());
```

**Ejemplo de uso**:
```csharp
Log.Information("Usuario {UserId} creó cita {AppointmentId}", userId, appointmentId);
Log.Warning("Intento de acceso no autorizado: {Email}", email);
Log.Error(ex, "Error procesando pago {TransactionId}", transactionId);
```

### 6. FluentValidation

**¿Qué es?**
Biblioteca para crear validadores fuertemente tipados y reutilizables.

**Ejemplo (futuro)**:
```csharp
public class CreateAppointmentValidator : AbstractValidator<CreateAppointmentDto>
{
    public CreateAppointmentValidator()
    {
        RuleFor(x => x.ScheduledDate)
            .GreaterThan(DateTime.UtcNow)
            .WithMessage("La fecha debe ser futura");
        
        RuleFor(x => x.ServiceId)
            .NotEmpty()
            .WithMessage("El servicio es obligatorio");
    }
}
```

### 7. AutoMapper

**¿Qué es?**
Biblioteca para mapear automáticamente entre objetos (ej: Entity → DTO).

**Ejemplo (futuro)**:
```csharp
// Perfil de mapeo
public class AppointmentProfile : Profile
{
    public AppointmentProfile()
    {
        CreateMap<Appointment, AppointmentDto>();
        CreateMap<CreateAppointmentDto, Appointment>();
    }
}

// Uso en controller
var dto = _mapper.Map<AppointmentDto>(appointment);
```

### 8. Swagger/OpenAPI

**¿Qué es?**
Especificación para describir APIs REST de forma estandarizada, con UI interactiva.

**Acceso**: `http://localhost:5185/swagger`

**Genera automáticamente**:
- Listado de endpoints
- Schemas de request/response
- Probador interactivo de API
- Exportación de especificación OpenAPI

---

## 🗄️ Modelo de Datos

### Entidades Principales

#### User (Usuario)
```csharp
- Id: Guid (PK)
- Email: string (unique)
- PasswordHash: string
- FirstName, LastName, Phone, ProfilePictureUrl
- Role: string (User/BusinessOwner/Admin)
- IsEmailVerified, IsActive
- AverageRating: decimal(3,2)
- TotalNoShows: int
- CreatedAt, UpdatedAt
```

#### Business (Negocio)
```csharp
- Id: Guid (PK)
- OwnerId: Guid (FK → User)
- Name, Description, Category
- Address, City, Department, Country
- Latitude: decimal(10,7), Longitude: decimal(10,7)
- Phone, Email, Website
- LogoUrl, CoverPhotoUrl
- IsActive, IsVerified
- AverageRating: decimal(3,2)
- SubscriptionPlan, SubscriptionStatus
- CreatedAt, UpdatedAt
```

#### Service (Servicio)
```csharp
- Id: Guid (PK)
- BusinessId: Guid (FK → Business)
- Name, Description
- Price: decimal(10,2), Duration: int (minutos)
- IsActive, RequiresDeposit
- DepositAmount: decimal(10,2)
- CreatedAt, UpdatedAt
```

#### Employee (Empleado)
```csharp
- Id: Guid (PK)
- BusinessId: Guid (FK → Business)
- UserId: Guid? (FK → User, nullable)
- FirstName, LastName, Phone, Email
- Position, Bio, PhotoUrl
- IsActive
- CreatedAt, UpdatedAt
```

#### Appointment (Cita)
```csharp
- Id: Guid (PK)
- ReferenceNumber: string (unique)
- UserId: Guid (FK → User)
- BusinessId: Guid (FK → Business)
- ServiceId: Guid (FK → Service)
- EmployeeId: Guid? (FK → Employee)
- ScheduledDate: DateTime
- Status: enum (Pending/Confirmed/Completed/Cancelled/NoShow)
- TotalAmount: decimal(10,2)
- DepositAmount: decimal(10,2)
- PaymentStatus: string
- Notes, CancellationReason
- CreatedAt, UpdatedAt
```

#### Review (Reseña)
```csharp
- Id: Guid (PK)
- AppointmentId: Guid (FK → Appointment)
- UserId: Guid (FK → User)
- BusinessId: Guid (FK → Business)
- Rating: int (1-5)
- Comment: string?
- Response: string? (respuesta del negocio)
- CreatedAt, UpdatedAt
```

#### WompiTransaction (Transacción Wompi)
```csharp
- Id: Guid (PK)
- AppointmentId: Guid (FK → Appointment)
- Reference: string (unique, Wompi ref)
- Amount: decimal(10,2)
- Currency: string (COP)
- Status: string (APPROVED/DECLINED/PENDING)
- PaymentMethod: string
- WompiResponse: string (JSON)
- CreatedAt, UpdatedAt
```

### Diagrama de Relaciones

```
User 1───────────* Business (Owner)
User 1───────────* Appointment (Customer)
User 1───────────* Review (Author)
User 1───────────1 Employee (Optional link)

Business 1───────* Service
Business 1───────* Employee
Business 1───────* Appointment
Business 1───────* Review
Business 1───────1 BusinessSettings

Service 1────────* Appointment

Employee 1───────* Appointment (Optional)

Appointment 1────1 Review
Appointment 1────1 WompiTransaction
Appointment 1────* AppointmentStatusHistory
```

---

## ⚙️ Configuración del Proyecto

### Requisitos Previos

1. **.NET 8 SDK**
   - Descargar: https://dotnet.microsoft.com/download/dotnet/8.0
   - Verificar: `dotnet --version` (debe mostrar 8.x.x)

2. **SQL Server**
   - SQL Server 2019+ / SQL Server Express / LocalDB
   - SQL Server Management Studio (SSMS) recomendado
   - Base de datos `TurnoyaDB` debe existir

3. **IDE** (uno de los siguientes):
   - Visual Studio 2022 (Community/Professional/Enterprise)
   - Visual Studio Code + extensión C# Dev Kit
   - JetBrains Rider

### Variables de Entorno y Configuración

#### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(local);Database=TurnoyaDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Issuer": "TurnoYaIssuer",
    "Audience": "TurnoYaAudience",
    "Secret": "CAMBIAR_POR_SECRETO_SEGURO_32_CARACTERES_MINIMO"
  }
}
```

#### Configurar Connection String

**Autenticación Windows** (recomendado local):
```
Server=(local);Database=TurnoyaDB;Trusted_Connection=True;TrustServerCertificate=True;
```

**SQL Server Authentication**:
```
Server=(local);Database=TurnoyaDB;User Id=sa;Password=TuPassword;TrustServerCertificate=True;
```

**Azure SQL Database**:
```
Server=tcp:servidor.database.windows.net,1433;Database=TurnoyaDB;User ID=usuario;Password=contraseña;Encrypt=True;
```

---

## 🚀 Ejecución en Local

### Opción 1: Visual Studio 2022

#### Paso 1: Abrir Solución
1. Abrir Visual Studio 2022
2. `File` → `Open` → `Project/Solution`
3. Navegar a `TurnoYaAPI` y seleccionar `TurnoYa.sln`

#### Paso 2: Restaurar Paquetes
- Visual Studio restaura automáticamente los paquetes NuGet
- Si no, click derecho en solución → `Restore NuGet Packages`

#### Paso 3: Configurar Proyecto de Inicio
1. En el **Solution Explorer**, click derecho en `TurnoYa.API`
2. Seleccionar `Set as Startup Project` (negrita)

#### Paso 4: Verificar Connection String
1. Abrir `TurnoYa.API/appsettings.json`
2. Verificar que `DefaultConnection` apunte a tu instancia de SQL Server
3. Confirmar que la base de datos `TurnoyaDB` existe

#### Paso 5: Aplicar Migraciones (si es primera vez)
1. `Tools` → `NuGet Package Manager` → `Package Manager Console`
2. Ejecutar:
   ```powershell
   Update-Database -Project TurnoYa.Infrastructure -StartupProject TurnoYa.API
   ```

#### Paso 6: Ejecutar
1. Presionar `F5` (Debug) o `Ctrl+F5` (Sin debug)
2. Visual Studio abrirá navegador con Swagger UI
3. URL típica: `https://localhost:7xxx` o `http://localhost:5xxx`

#### Paso 7: Verificar Health Check
- Navegar a: `https://localhost:7xxx/health`
- Debe responder: `{"status":"OK","db":"UP","timestamp":"..."}`

---

### Opción 2: Visual Studio Code

#### Paso 1: Abrir Proyecto
1. Abrir VS Code
2. `File` → `Open Folder`
3. Seleccionar carpeta `TurnoYaAPI`

#### Paso 2: Instalar Extensiones (si no están)
- **C# Dev Kit** (incluye C# y .NET debugging)
- **NuGet Package Manager** (opcional)

#### Paso 3: Restaurar y Compilar
Abrir terminal integrada (`Ctrl+` ` ) y ejecutar:
```bash
dotnet restore
dotnet build TurnoYa.sln
```

#### Paso 4: Aplicar Migraciones
```bash
dotnet ef database update -p TurnoYa.Infrastructure -s TurnoYa.API
```

#### Paso 5: Ejecutar API
```bash
dotnet run --project TurnoYa.API
```

Salida esperada:
```
[08:30:15 INF] Now listening on: http://localhost:5185
[08:30:15 INF] Application started. Press Ctrl+C to shut down.
```

#### Paso 6: Abrir Swagger
- Navegador: `http://localhost:5185/swagger`
- Health check: `http://localhost:5185/health`

#### Paso 7: Debug (opcional)
1. Presionar `F5` o click en `Run and Debug`
2. Seleccionar `.NET Core Launch (web)`
3. Configurar breakpoints en código
4. Debugging activo con inspección de variables

---

### Opción 3: Terminal/Línea de Comandos

#### Windows (CMD/PowerShell)
```cmd
cd C:\Users\USUARIO\Desktop\Perfil_Profesional\Proyectos\TurnoYa\TurnoYaAPI

# Restaurar dependencias
dotnet restore

# Compilar solución
dotnet build TurnoYa.sln

# Aplicar migraciones
dotnet ef database update -p TurnoYa.Infrastructure -s TurnoYa.API

# Ejecutar API
dotnet run --project TurnoYa.API
```

#### Linux/macOS (Bash)
```bash
cd ~/Proyectos/TurnoYa/TurnoYaAPI

# Restaurar dependencias
dotnet restore

# Compilar solución
dotnet build TurnoYa.sln

# Aplicar migraciones
dotnet ef database update -p TurnoYa.Infrastructure -s TurnoYa.API

# Ejecutar API
dotnet run --project TurnoYa.API
```

#### Git Bash (Windows)
```bash
cd /c/Users/USUARIO/Desktop/Perfil_Profesional/Proyectos/TurnoYa/TurnoYaAPI

dotnet restore
dotnet build TurnoYa.sln
dotnet ef database update -p TurnoYa.Infrastructure -s TurnoYa.API
dotnet run --project TurnoYa.API
```

---

### Opción 4: Docker (Futuro)

```dockerfile
# Dockerfile (ejemplo para futuro)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["TurnoYa.API/TurnoYa.API.csproj", "TurnoYa.API/"]
COPY ["TurnoYa.Infrastructure/TurnoYa.Infrastructure.csproj", "TurnoYa.Infrastructure/"]
COPY ["TurnoYa.Application/TurnoYa.Application.csproj", "TurnoYa.Application/"]
COPY ["TurnoYa.Core/TurnoYa.Core.csproj", "TurnoYa.Core/"]
RUN dotnet restore "TurnoYa.API/TurnoYa.API.csproj"
COPY . .
RUN dotnet build "TurnoYa.API/TurnoYa.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TurnoYa.API/TurnoYa.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TurnoYa.API.dll"]
```

```bash
# Construir imagen
docker build -t turnoya-api:latest .

# Ejecutar contenedor
docker run -d -p 8080:80 -e ConnectionStrings__DefaultConnection="Server=host.docker.internal;Database=TurnoyaDB;..." turnoya-api:latest
```

---

## 🧰 Comandos Útiles

### Comandos dotnet CLI

#### Solución y Proyectos
```bash
# Crear nueva solución
dotnet new sln -n TurnoYa

# Crear proyectos
dotnet new webapi -n TurnoYa.API
dotnet new classlib -n TurnoYa.Core
dotnet new classlib -n TurnoYa.Infrastructure
dotnet new classlib -n TurnoYa.Application

# Agregar proyectos a solución
dotnet sln add TurnoYa.API/TurnoYa.API.csproj
dotnet sln add TurnoYa.Core/TurnoYa.Core.csproj
dotnet sln add TurnoYa.Infrastructure/TurnoYa.Infrastructure.csproj
dotnet sln add TurnoYa.Application/TurnoYa.Application.csproj

# Agregar referencias entre proyectos
dotnet add TurnoYa.API reference TurnoYa.Application
dotnet add TurnoYa.API reference TurnoYa.Infrastructure
dotnet add TurnoYa.Infrastructure reference TurnoYa.Core
dotnet add TurnoYa.Application reference TurnoYa.Core
```

#### Paquetes NuGet
```bash
# Restaurar paquetes
dotnet restore

# Agregar paquete
dotnet add TurnoYa.API package Serilog.AspNetCore --version 8.0.0

# Listar paquetes
dotnet list TurnoYa.API package

# Actualizar paquete
dotnet add TurnoYa.API package Serilog.AspNetCore
```

#### Compilación y Ejecución
```bash
# Compilar solución
dotnet build TurnoYa.sln

# Compilar en Release
dotnet build TurnoYa.sln -c Release

# Limpiar artefactos de compilación
dotnet clean

# Ejecutar proyecto
dotnet run --project TurnoYa.API

# Ejecutar sin compilar (usa última compilación)
dotnet run --project TurnoYa.API --no-build

# Ejecutar con hot reload
dotnet watch run --project TurnoYa.API

# Publicar para despliegue
dotnet publish TurnoYa.API -c Release -o ./publish
```

### Entity Framework Core

#### Migraciones
```bash
# Instalar herramientas EF (global, una sola vez)
dotnet tool install --global dotnet-ef

# Actualizar herramientas EF
dotnet tool update --global dotnet-ef

# Listar migraciones
dotnet ef migrations list -p TurnoYa.Infrastructure -s TurnoYa.API

# Crear nueva migración
dotnet ef migrations add NombreMigracion -p TurnoYa.Infrastructure -s TurnoYa.API -o Data/Migrations

# Aplicar migraciones pendientes
dotnet ef database update -p TurnoYa.Infrastructure -s TurnoYa.API

# Revertir a migración específica
dotnet ef database update MigracionAnterior -p TurnoYa.Infrastructure -s TurnoYa.API

# Remover última migración (si no se aplicó)
dotnet ef migrations remove -p TurnoYa.Infrastructure -s TurnoYa.API

# Generar script SQL de migraciones
dotnet ef migrations script -p TurnoYa.Infrastructure -s TurnoYa.API -o migration.sql

# Generar script SQL desde migración específica
dotnet ef migrations script MigracionInicial MigracionFinal -p TurnoYa.Infrastructure -s TurnoYa.API
```

#### DbContext
```bash
# Ver información del DbContext
dotnet ef dbcontext info -p TurnoYa.Infrastructure -s TurnoYa.API

# Generar script de creación de BD
dotnet ef dbcontext script -p TurnoYa.Infrastructure -s TurnoYa.API

# Scaffold desde BD existente (ingeniería inversa)
dotnet ef dbcontext scaffold "Server=(local);Database=TurnoyaDB;Trusted_Connection=True;" Microsoft.EntityFrameworkCore.SqlServer -o Models
```

### Testing (cuando se implemente)
```bash
# Ejecutar todos los tests
dotnet test

# Ejecutar tests con detalle
dotnet test --verbosity detailed

# Ejecutar tests con cobertura
dotnet test /p:CollectCoverage=true

# Ejecutar tests de proyecto específico
dotnet test TurnoYa.Tests/TurnoYa.Tests.csproj
```

### Información y Diagnóstico
```bash
# Ver versión de .NET
dotnet --version

# Ver información del runtime
dotnet --info

# Listar SDKs instalados
dotnet --list-sdks

# Listar runtimes instalados
dotnet --list-runtimes

# Ver información del proyecto
dotnet --info

# Verificar restauración sin restaurar
dotnet restore --no-cache --verify-xproj
```

---

## 🛠️ Troubleshooting

### Problema: "No se puede conectar a la base de datos"

**Síntomas**:
```
SqlException: A network-related or instance-specific error occurred...
```

**Soluciones**:

1. **Verificar SQL Server está corriendo**:
   ```powershell
   # Windows Services
   services.msc → buscar "SQL Server"
   
   # O desde CMD
   net start MSSQLSERVER
   ```

2. **Verificar connection string**:
   - Abrir `appsettings.json`
   - Validar nombre del servidor: `(local)`, `localhost`, `.\SQLEXPRESS`
   - Confirmar nombre de base de datos: `TurnoyaDB`

3. **Probar conexión con SSMS**:
   - Abrir SQL Server Management Studio
   - Conectar con mismo server de connection string
   - Confirmar que base de datos `TurnoyaDB` existe

4. **Crear base de datos si no existe**:
   ```sql
   CREATE DATABASE TurnoyaDB;
   ```

---

### Problema: "The EntityFrameworkCore tools version X is older than Y"

**Solución**:
```bash
dotnet tool update --global dotnet-ef
```

---

### Problema: "Build failed" o errores de compilación

**Soluciones**:

1. **Limpiar y recompilar**:
   ```bash
   dotnet clean
   dotnet build TurnoYa.sln
   ```

2. **Restaurar paquetes**:
   ```bash
   dotnet restore --force
   ```

3. **Verificar versiones de .NET**:
   - Todos los proyectos deben usar `<TargetFramework>net8.0</TargetFramework>`
   - Verificar en cada `.csproj`

4. **Cerrar Visual Studio y borrar carpetas**:
   - Eliminar carpetas `bin/` y `obj/` de todos los proyectos
   - Reabrir solución

---

### Problema: "Migrations already applied"

**Síntoma**:
```
There is already an object named 'Users' in the database.
```

**Solución**:
- Ya aplicada la migración baseline
- Para nuevos cambios crear nueva migración:
  ```bash
  dotnet ef migrations add AgregarNuevoCampo -p TurnoYa.Infrastructure -s TurnoYa.API
  dotnet ef database update -p TurnoYa.Infrastructure -s TurnoYa.API
  ```

---

### Problema: "Port 5185 already in use"

**Soluciones**:

1. **Cambiar puerto en `launchSettings.json`**:
   ```json
   "applicationUrl": "http://localhost:5186"
   ```

2. **Matar proceso usando el puerto**:
   ```bash
   # Windows
   netstat -ano | findstr :5185
   taskkill /PID <PID> /F
   
   # Linux/macOS
   lsof -i :5185
   kill -9 <PID>
   ```

---

### Problema: "JWT Bearer token invalid"

**Síntomas**:
```
401 Unauthorized
```

**Soluciones**:

1. **Verificar configuración JWT** en `appsettings.json`
2. **Cambiar Secret** por uno de al menos 32 caracteres:
   ```json
   "Jwt": {
     "Secret": "MiSuperSecretoSeguro123456789012345"
   }
   ```
3. **Verificar formato del token** en header:
   ```
   Authorization: Bearer <token>
   ```

---

### Problema: Swagger no aparece

**Soluciones**:

1. **Verificar ambiente Development**:
   ```bash
   # Windows
   $env:ASPNETCORE_ENVIRONMENT="Development"
   
   # Linux/macOS
   export ASPNETCORE_ENVIRONMENT=Development
   ```

2. **Acceder a URL correcta**:
   - `http://localhost:5185/swagger` (NO `/swagger/index.html`)

3. **Verificar configuración en `Program.cs`**:
   ```csharp
   if (app.Environment.IsDevelopment())
   {
       app.UseSwagger();
       app.UseSwaggerUI();
   }
   ```

---

### Problema: "Cannot find compilation library for package AutoMapper"

**Solución**:
```bash
dotnet restore --force
dotnet build
```

Si persiste:
```bash
dotnet nuget locals all --clear
dotnet restore
```

---

## 📚 Referencias y Recursos

### Documentación Oficial

- **.NET**: https://docs.microsoft.com/dotnet
- **ASP.NET Core**: https://docs.microsoft.com/aspnet/core
- **Entity Framework Core**: https://docs.microsoft.com/ef/core
- **SQL Server**: https://docs.microsoft.com/sql

### Librerías Utilizadas

- **Serilog**: https://serilog.net
- **FluentValidation**: https://docs.fluentvalidation.net
- **AutoMapper**: https://docs.automapper.org
- **Dapper**: https://github.com/DapperLib/Dapper
- **Swashbuckle**: https://github.com/domaindrivendev/Swashbuckle.AspNetCore

### Patrones y Arquitectura

- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **DDD**: https://martinfowler.com/bliki/DomainDrivenDesign.html
- **Repository Pattern**: https://docs.microsoft.com/aspnet/mvc/overview/older-versions/getting-started-with-ef-5-using-mvc-4/implementing-the-repository-and-unit-of-work-patterns

### Documentación Interna

- `docs/Backend_NET.md`: Arquitectura detallada, roadmap, estrategias
- `README_API.md`: Guía rápida de inicio

---

## 📝 Notas Finales

### Convenciones de Código

- **Nombres de clases**: PascalCase (`AppointmentService`, `UserController`)
- **Nombres de métodos**: PascalCase (`CreateAppointment`, `GetUserById`)
- **Nombres de variables**: camelCase (`userId`, `appointmentList`)
- **Nombres de constantes**: PascalCase (`MaxAppointmentsPerDay`)
- **Interfaces**: Prefijo `I` (`IRepository`, `IAppointmentService`)

### Próximos Pasos de Desarrollo

1. ✅ Estructura base creada
2. ✅ Migraciones aplicadas
3. ✅ Health check implementado
4. ⏳ **Implementar autenticación** (`AuthController`, registro, login, refresh)
5. ⏳ **CRUD de negocios** (`BusinessController`, servicios, empleados)
6. ⏳ **Sistema de citas** (disponibilidad, creación, confirmación)
7. ⏳ **Integración Wompi** (crear transacción, webhook)
8. ⏳ **Sistema de reseñas** (crear review, moderación)
9. ⏳ **Reputación anti no-show** (penalizaciones, bloqueos)

### Seguridad - Checklist Pre-Producción

- [ ] Cambiar `Jwt:Secret` por valor seguro de 64+ caracteres
- [ ] Habilitar HTTPS obligatorio
- [ ] Configurar CORS restrictivo (dominios específicos)
- [ ] Implementar rate limiting
- [ ] Agregar validación de input en todos los endpoints
- [ ] Sanitizar logs (no incluir datos sensibles)
- [ ] Implementar refresh tokens con rotación
- [ ] Configurar políticas de contraseñas fuertes
- [ ] Auditoría de accesos y cambios críticos
- [ ] Encriptar datos sensibles en BD (si aplica)

---

**Última actualización**: 25 de noviembre de 2025  
**Versión**: 1.0  
**Autor**: Equipo TurnoYa Backend

Para preguntas o issues, consultar la documentación en `docs/Backend_NET.md` o revisar el código fuente con comentarios XML.
