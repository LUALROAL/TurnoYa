# Backend Técnico - TurnoYa API v1

Documentación técnica detallada de la API REST de TurnoYa implementada con .NET 8, Entity Framework Core y SQL Server.

**Última actualización:** 20 de febrero de 2026
**Estado:** En desarrollo - MVP en progreso
**Versión de API:** v1

---

## Tabla de Contenido

1. [Arquitectura General](#arquitectura-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Configuración Inicial](#configuración-inicial)
4. [Endpoints Implementados](#endpoints-implementados)
   - [Autenticación](#autenticación---apiauth)
   - [Perfil de Usuario](#perfil-de-usuario---apiusers)
   - [Administración](#administración-de-usuarios---apiadmin)
5. [Manejo de Errores](#manejo-de-errores)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [Validaciones](#validaciones)
8. [Modelos de Datos](#modelos-de-datos)
9. [DTOs](#dtos)
10. [Servicios](#servicios)
11. [Mapeos AutoMapper](#mapeos-automapper)

---

## Arquitectura General

### Estructura de Carpetas

```
TurnoYaAPI/
├── TurnoYa.API/
│   ├── Controllers/          # Controladores REST
│   ├── Program.cs            # Configuración y pipeline
│   └── Properties/           # Configuración de lanzamiento
├── TurnoYa.Application/
│   ├── DTOs/                # Data Transfer Objects por módulo
│   ├── Interfaces/          # Contratos de servicios
│   ├── Mappings/            # Perfiles de AutoMapper
│   ├── Services/            # Servicios de aplicación (se implementan en Infrastructure)
│   └── Validators/          # Validadores de FluentValidation
├── TurnoYa.Core/
│   ├── Entities/            # Modelos de dominio
│   └── Interfaces/          # Contratos de repositorio
└── TurnoYa.Infrastructure/
    ├── Data/                # DbContext y migrations
    ├── Services/            # Implementaciones de servicios
    └── Repositories/        # Implementaciones de repositorios
```

### Patrones Utilizados

- **Repository Pattern**: Acceso a datos con IBusinessRepository
- **Service Pattern**: Lógica de negocio en servicios (AuthService, UserService, etc.)
- **DTO Pattern**: Transferencia de datos entre capas
- **Dependency Injection**: Contenedor IoC nativo de ASP.NET Core
- **Mapper Pattern**: AutoMapper para transformaciones automáticas
- **Validator Pattern**: FluentValidation para validaciones declarativas

---

## Stack Tecnológico

| Componente | Versión | Propósito |
|-----------|---------|----------|
| .NET      | 8.0    | Framework base |
| Entity Framework Core | 8.0 | ORM |
| SQL Server | 2019+ | Base de datos |
| AutoMapper | 12.0+ | Mapeo de objetos |
| FluentValidation | 11.0+ | Validaciones |
| Serilog | 3.0+ | Logging estructurado |
| JWT Bearer | 8.0+ | Autenticación |
| Newtonsoft.Json | 12.0+ | Serialización JSON |

---

## Configuración Inicial

### Program.cs - Punto de entrada

**Ubicación:** `TurnoYa.API/Program.cs`

**Principales configuraciones:**

```csharp
// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// AutoMapper
builder.Services.AddAutoMapper(
    typeof(AuthProfile),
    typeof(BusinessProfile),
    // ... otros profiles
);

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterUserDtoValidator>();

// ProblemDetails - Manejo estandarizado de errores
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
    };
});

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = configuration["Jwt:Issuer"],
            ValidAudience = configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Secret"]!))
        };
    });

// Serialización JSON con enum como strings
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:8100")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

---

## Endpoints Implementados

### Autenticación - `/api/auth`

#### 1. Registro de Usuario
```
POST /api/auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "firstName": "Juan",
  "lastName": "García",
  "password": "SecurePass123",
  "phone": "+34612345678",
  "role": "Customer"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "RefreshTokenValue",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "Juan",
    "lastName": "García",
    "fullName": "Juan García",
    "role": "Customer",
    "profilePictureUrl": null,
    "isEmailVerified": false,
    "createdAt": "2026-02-20T10:30:00Z"
  }
}
```

**Código:** [AuthController.cs - Register](../TurnoYaAPI/TurnoYa.API/Controllers/AuthController.cs#L30)

---

#### 2. Login
```
POST /api/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "RefreshTokenValue",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "Juan",
    "lastName": "García",
    "fullName": "Juan García",
    "role": "Customer",
    "profilePictureUrl": null,
    "isEmailVerified": true,
    "createdAt": "2026-02-20T10:30:00Z"
  }
}
```

---

#### 3. Renovar Token
```
POST /api/auth/refresh
```

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "RefreshTokenValue"
}
```

**Response (200 OK):** Devuelve nueva AuthResponseDto

---

#### 4. Revocar Token (Logout)
```
POST /api/auth/revoke/{userId}
```

**Response (204 No Content)**

---

### Perfil de Usuario - `/api/users`

#### 1. Obtener Perfil Actual
```
GET /api/users/me
```

**Headers requeridos:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "firstName": "Juan",
  "lastName": "García",
  "fullName": "Juan García",
  "phoneNumber": "+34612345678",
  "phone": "+34612345678",
  "photoUrl": "https://example.com/photo.jpg",
  "dateOfBirth": "1990-05-15T00:00:00Z",
  "gender": "M",
  "role": "Customer",
  "isEmailVerified": true,
  "isActive": true,
  "lastLogin": "2026-02-20T10:30:00Z",
  "averageRating": 4.5,
  "completedAppointments": 12,
  "createdAt": "2026-02-20T10:30:00Z"
}
```

**Código:** [UsersController.cs - GetProfile](../TurnoYaAPI/TurnoYa.API/Controllers/UsersController.cs#L65)

---

#### 2. Actualizar Perfil
```
PUT /api/users/me
```

**Headers requeridos:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "firstName": "Juan Carlos",
  "lastName": "García López",
  "phoneNumber": "+34612345679",
  "gender": "M",
  "dateOfBirth": "1990-05-15"
}
```

**Response (200 OK):** Devuelve UserProfileDto actualizado

**Notas:**
- Todos los campos son opcionales
- Solo se actualizan los campos proporcionados
- Email no puede ser modificado

---

#### 3. Cambiar Contraseña
```
PATCH /api/users/me/password
```

**Headers requeridos:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456",
  "confirmPassword": "NewPassword456"
}
```

**Response (204 No Content)**

**Validaciones:**
- Contraseña actual debe ser correcta
- Nueva contraseña mínimo 8 caracteres
- Debe contener: mayúscula, minúscula, dígito
- Contraseña nueva ≠ contraseña actual
- confirmPassword debe coincidir con newPassword

---

### Administración de Usuarios - `/api/admin`

> ⚠️ **Requiere autenticación y rol "Admin"**

#### 1. Buscar Usuarios
```
GET /api/admin/users?searchTerm=&role=&page=1&pageSize=10
```

**Headers requeridos:**
```
Authorization: Bearer {adminToken}
```

**Query Parameters:**
- `searchTerm` (string, opcional): Busca en email, firstName, lastName
- `role` (string, opcional): Filtrar por rol (Customer, Owner, Admin)
- `page` (int, default: 1): Número de página
- `pageSize` (int, default: 10, max: 100): Elementos por página

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "Juan",
      "lastName": "García",
      "fullName": "Juan García",
      "role": "Customer",
      "profilePictureUrl": null,
      "isEmailVerified": true,
      "isBlocked": false,
      "blockReason": null,
      "blockUntil": null,
      "createdAt": "2026-02-20T10:30:00Z",
      "lastLoginAt": "2026-02-20T14:15:00Z"
    }
  ],
  "totalCount": 150,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 15
}
```

**Errores:**
- `400`: Parámetros de paginación inválidos
- `401`: No autenticado
- `403`: No tiene rol de Admin

---

#### 2. Obtener Detalles de Usuario
```
GET /api/admin/users/{userId}
```

**Headers requeridos:**
```
Authorization: Bearer {adminToken}
```

**Response (200 OK):** Devuelve UserManageDto con todos los detalles

**Errores:**
- `404`: Usuario no encontrado
- `401`: No autenticado
- `403`: No tiene rol de Admin

---

#### 3. Actualizar Estado de Usuario (Bloqueo)
```
PATCH /api/admin/users/{userId}/status
```

**Headers requeridos:**
```
Authorization: Bearer {adminToken}
```

**Request:**
```json
{
  "isBlocked": true,
  "blockReason": "Violación de términos de servicio",
  "blockUntil": "2026-03-20T10:30:00Z"
}
```

**Response (200 OK):** Devuelve UserManageDto actualizado

**Notas:**
- `isBlocked`: true para bloquear, false para desbloquear
- `blockReason` (opcional): Razón del bloqueo
- `blockUntil` (opcional): Fecha/hora hasta la que se bloquea la cuenta

**Errores:**
- `400`: Datos inválidos
- `404`: Usuario no encontrado
- `401`: No autenticado
- `403`: No tiene rol de Admin

---

#### 4. Actualizar Rol de Usuario
```
PATCH /api/admin/users/{userId}/role
```

**Headers requeridos:**
```
Authorization: Bearer {adminToken}
```

**Request:**
```json
{
  "role": "Owner"
}
```

**Roles válidos:** `Customer`, `Owner`, `Admin`

**Response (200 OK):** Devuelve UserDto actualizado

**Errores:**
- `400`: Rol inválido
- `404`: Usuario no encontrado
- `401`: No autenticado
- `403`: No tiene rol de Admin

---

## Manejo de Errores

### ProblemDetails Estándar

Todos los errores de la API responden con el formato estándar **RFC 7807**:

```json
{
  "type": "https://httpstatuses.com/400",
  "title": "Error de validación",
  "status": 400,
  "detail": "El email ya está registrado",
  "instance": "/api/auth/register",
  "traceId": "0HN1GMQTRMJ7B:00000001"
}
```

### Códigos de Error

| Código | Significado | Body |
|--------|------------|------|
| 400 | Bad Request | ProblemDetails con detalle del error |
| 401 | Unauthorized | Token inválido o expirado |
| 404 | Not Found | Recurso no encontrado |
| 422 | Unprocessable | Error de lógica de negocio |
| 500 | Internal Server Error | Error del servidor con traceId |

### Respuesta de Validación

**Request inválido ejemplo:**
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "invalid-email",
  "firstName": "",
  "password": "short"
}
```

**Response (400 Bad Request):**
```json
{
  "type": "https://httpstatuses.com/400",
  "title": "Error de validación",
  "status": 400,
  "traceId": "0HN1GMQTRMJ7B:00000001",
  "errors": {
    "Email": ["El email debe ser válido"],
    "FirstName": ["El nombre es requerido"],
    "Password": ["La contraseña debe tener mínimo 8 caracteres"]
  }
}
```

---

## Autenticación y Autorización

### JWT (JSON Web Tokens)

**Configuración:**
- **Algoritmo:** HS256 (HMAC with SHA-256)
- **Issuer:** "TurnoYa.API"
- **Audience:** "TurnoYa.Client"
- **Expiration:** 1 hora (3600 segundos)
- **Refresh token expiration:** 7 días

### Claims del Token

```csharp
// Claims incluidos en el JWT
token.AddClaim("sub", userId);           // Subject - ID del usuario
token.AddClaim("email", user.Email);     // Email del usuario
token.AddClaim("role", user.Role);       // Rol del usuario
token.AddClaim("fullname", user.FullName); // Nombre completo
```

### Atributos de Autorización

```csharp
// Requiere autenticación
[Authorize]
public async Task<ActionResult<UserProfileDto>> GetProfile() { }

// Requiere rol específico (futuro)
[Authorize(Roles = "Admin,Owner")]
public async Task<IActionResult> UpdateUserRole(string userId, ...) { }
```

---

## Validaciones

### Validadores Implementados

#### RegisterUserDtoValidator
**Archivo:** `TurnoYa.Application/Validators/RegisterUserDtoValidator.cs`
```csharp
- Email: obligatorio, formato válido, no puede existir
- FirstName: 1-50 caracteres
- LastName: 1-50 caracteres
- Password: mínimo 8 caracteres, mayúscula, minúscula, dígito
- Phone: 7-15 dígitos
```

#### UpdateUserProfileDtoValidator
**Archivo:** `TurnoYa.Application/Validators/UpdateUserProfileDtoValidator.cs`
```csharp
- FirstName: máximo 50 caracteres
- LastName: máximo 50 caracteres
- PhoneNumber: 7-15 dígitos
- Phone: 7-15 dígitos
- PhotoUrl: URI válida
- DateOfBirth: mínimo 13 años
- Gender: M, F o Other
```

#### ChangePasswordDtoValidator
**Archivo:** `TurnoYa.Application/Validators/ChangePasswordDtoValidator.cs`
```csharp
- CurrentPassword: mínimo 8 caracteres
- NewPassword: mínimo 8 caracteres, mayúscula, minúscula, dígito
- ConfirmPassword: debe coincidir con NewPassword
- NewPassword ≠ CurrentPassword
```

---

## Modelos de Datos

### User Entity
**Archivo:** `TurnoYa.Core/Entities/User.cs`

```csharp
public class User : BaseEntity
{
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public int NoShowCount { get; set; }
    public int TotalNoShows { get; set; }
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public DateTime? BlockUntil { get; set; }
    public decimal AverageRating { get; set; }
    public int CompletedAppointments { get; set; }
    public DateTime? LastLogin { get; set; }
    public string Role { get; set; } = "Customer";
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<Business> OwnedBusinesses { get; set; }
    public ICollection<Appointment> Appointments { get; set; }
    public ICollection<Review> Reviews { get; set; }
}
```

---

## DTOs

### AuthResponseDto
```csharp
public class AuthResponseDto
{
    public string Token { get; set; }
    public string RefreshToken { get; set; }
    public int ExpiresIn { get; set; }
    public UserDto User { get; set; }
}
```

### UserProfileDto
```csharp
public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string Role { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastLogin { get; set; }
    public decimal AverageRating { get; set; }
    public int CompletedAppointments { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### UpdateUserProfileDto
```csharp
public class UpdateUserProfileDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
}
```

### ChangePasswordDto
```csharp
public class ChangePasswordDto
{
    public string CurrentPassword { get; set; }
    public string NewPassword { get; set; }
    public string ConfirmPassword { get; set; }
}
```

---

## Servicios

### AuthService
**Ubicación:** `TurnoYa.Infrastructure/Services/AuthService.cs`

**Métodos públicos:**
- `RegisterAsync(RegisterUserDto)` → `AuthResponseDto`
- `LoginAsync(LoginDto)` → `AuthResponseDto`
- `RefreshTokenAsync(RefreshTokenDto)` → `AuthResponseDto`
- `RevokeTokenAsync(string userId)` → `Task`
- `UpdateUserRoleAsync(string userId, string newRole, string requestorRole)` → `UserDto`

### UserService
**Ubicación:** `TurnoYa.Infrastructure/Services/UserService.cs`

**Métodos públicos:**
- `GetUserProfileAsync(string userId)` → `UserProfileDto`
- `UpdateUserProfileAsync(string userId, UpdateUserProfileDto updateDto)` → `UserProfileDto`
- `ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto)` → `Task`

**Características:**
- Valida que el usuario exista
- Solo actualiza campos proporcionados (PATCH semántico)
- Verifica contraseña actual antes de cambiar
- Hasea contraseña nueva con PasswordHasher

---

## Mapeos AutoMapper

### AuthProfile
**Ubicación:** `TurnoYa.Application/Mappings/AuthProfile.cs`

```csharp
// RegisterUserDto → User
CreateMap<RegisterUserDto, User>()
    .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.ToLower()))
    .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Phone))
    .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.Phone))
    ...; // Otros mappings

// User → UserDto
CreateMap<User, UserDto>()
    .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
    .ForMember(dest => dest.ProfilePictureUrl, opt => opt.MapFrom(src => src.PhotoUrl));

// User → UserProfileDto
CreateMap<User, UserProfileDto>()
    .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"));
```

---

## Testing

### Endpoints disponibles para testear

**En Swagger UI:**
```
http://localhost:5001/swagger/index.html
```

**Con cURL:**
```bash
# Registrar usuario
curl -X POST https://localhost:7001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPass123",
    "phone": "+34612345678"
  }'

# Obtener perfil (usar token del registro)
curl -X GET https://localhost:7001/api/users/me \
  -H "Authorization: Bearer {token}"
```

---

## Próximos Pasos

- [ ] EPIC 2: Implementar logout y políticas por rol
- [ ] EPIC 4: Endpoints de admin usuarios
- [ ] EPIC 5: Endpoints de pagos
- [ ] Tests unitarios para servicios críticos
- [ ] Implementar rate limiting
- [ ] Documentar endpoints adicionales

---

**Mantenedor:** Equipo de desarrollo
**Última revisión:** 20 de febrero de 2026
