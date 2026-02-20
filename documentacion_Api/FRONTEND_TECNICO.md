# Frontend Técnico - TurnoYa Ionic Angular v1

Documentación técnica detallada del cliente Ionic Angular para TurnoYa.

**Última actualización:** 20 de febrero de 2026
**Estado:** En desarrollo - MVP en progreso
**Versión de Aplicación:** v1

---

## Tabla de Contenido

1. [Arquitectura General](#arquitectura-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Módulos e Implementación](#módulos-e-implementación)
5. [Servicios](#servicios)
6. [Componentes Principales](#componentes-principales)
7. [Guardias de Ruta](#guardias-de-ruta)
8. [Interceptores](#interceptores)
9. [Enrutamiento](#enrutamiento)

---

## Arquitectura General

### Stack de Frontend

- **Framework:** Ionic Angular 18
- **CSS Framework:** Tailwind CSS 3
- **HTTP Client:** HttpClient (Angular)
- **Estado:** Angular Signals + RxJS Observables
- **Formularios:** Reactive Forms (FormBuilder, FormGroup)
- **Build Tool:** Capacitor (móvil), ng build (web)

### Patrones Utilizados

1. **Standalone Components:** Todos los componentes son standalone
2. **Señales de Angular:** Para estado local con `signal()`, `computed()`, `effect()`
3. **Servicios Inyectables:** Gestión de datos y lógica de negocio
4. **Reactive Forms:** Formularios con validaciones complejas
5. **Interceptores HTTP:** Autenticación (JWT) y manejo centralizado de errores

---

## Stack Tecnológico

### Dependencias Principales

```json
{
  "@ionic/angular": "^7.x",
  "@ionic/core": "^7.x",
  "@angular/core": "^18.x",
  "@angular/router": "^18.x",
  "@angular/forms": "^18.x",
  "@angular/common": "^18.x",
  "tailwindcss": "^3.x",
  "ionicons": "^7.x",
  "rxjs": "^7.x"
}
```

### Configuración de Build

- **TypeScript:** v5.x con `strict: true`
- **PostCSS:** Para compilación de Tailwind CSS
- **ESLint:** Linting de código TypeScript
- **Karma/Jasmine:** Testing unitario (configurado pero no utilizado en MVP)

---

## Estructura de Carpetas

```
src/
├── app/
│   ├── core/                          # Servicios centralizados
│   │   ├── constants/                 # Constantes de la aplicación
│   │   ├── guards/                    # Guardias de autenticación y roles
│   │   ├── interceptors/              # Interceptores HTTP (JWT, errores)
│   │   ├── models/                    # Modelos/Interfaces TypeScript
│   │   └── services/
│   │       ├── api.service.ts         # Configuración base HTTP
│   │       ├── auth-session.service.ts# Gestión de sesión y tokens
│   │       └── notify.service.ts      # Notificaciones toast/alerts
│   │
│   ├── features/                      # Módulos de funcionalidad
│   │   ├── auth/                      # Autenticación (login/register)
│   │   ├── business/                  # Listado y detalle de negocios
│   │   ├── owner-business/            # Gestión de negocio del propietario
│   │   ├── owner-services/            # Servicios por negocio
│   │   ├── owner-employees/           # Empleados por negocio
│   │   ├── owner-appointments/        # Citas de propietario
│   │   ├── appointments/              # Agendar citas de cliente
│   │   ├── account/                   # Perfil de usuario
│   │   │   ├── pages/profile/         # Página de perfil
│   │   │   └── services/user.service.ts
│   │   └── admin/                     # Administración (NUEVO)
│   │       ├── pages/                 # Componentes de admin
│   │       └── services/              # Servicios de admin
│   │
│   ├── home/                          # Página de inicio (home)
│   ├── app.component.*                # Componente raíz
│   └── main.ts                        # Configuración de rutas y providers
│
├── environments/                      # Configuración por ambiente
│   ├── environment.ts                 # Desarrollo
│   └── environment.prod.ts            # Producción
│
├── theme/                             # Temas de Ionic
└── index.html                         # HTML raíz
```

---

## Módulos e Implementación

### EPIC 1 - Bootstrap ✅

**Estado:** Completo

- [x] Proyecto Ionic Angular configurado
- [x] Tailwind CSS integrado con PostCSS
- [x] Entornos (dev/prod) configurados
- [x] Cliente HTTP base en `core/services/api.service.ts`
- [x] Interceptor JWT implementado en `core/interceptors/auth.interceptor.ts`
- [x] Manejo global de errores en `core/interceptors/error.interceptor.ts`

### EPIC 2 - Autenticación ✅

**Estado:** Completo

- [x] AuthService con métodos register() y login()
- [x] LoginPage y RegisterPage con Reactive Forms
- [x] Autorización con JWT Bearer tokens
- [x] Refresh token automático
- [x] AuthGuard para rutas protegidas
- [x] AuthSessionService para gestión de sesión

### EPIC 3 - Catálogo y Negocios ✅

**Estado:** Completo

- [x] HomePage con layout base
- [x] BusinessListPage con búsqueda y filtros
- [x] BusinessDetailPage con información detallada
- [x] OwnerBusinessModule para gestión de negocios del propietario

### EPIC 4 - Servicios y Empleados ✅

**Estado:** Completo

- [x] CRUD completo de servicios
- [x] CRUD completo de empleados

### EPIC 5 - Citas ✅

**Estado:** Completo

- [x] AppointmentCreatePage para agendar
- [x] AppointmentsListPage (cliente)
- [x] OwnerAppointmentsListPage (propietario)
- [x] Cambios de estado de cita

### EPIC 6 - Perfil y Administración ⏳

**Estado:** Parcialmente Completo

- [x] ProfilePage con edición de datos y cambio de contraseña
- [x] UserService para operaciones de perfil
- [x] ⏳ **Módulo Admin Usuarios (EN PROGRESO)**

#### Módulo Admin Usuarios (NUEVO)

**Estructura:**
```
src/app/features/admin/
├── pages/
│   └── admin-users.page.ts           # Página de gestión de usuarios
└── services/
    └── admin-users.service.ts        # Servicio para operaciones admin
```

**AdminUsersService**

Interfaz de servicios:
```typescript
// Búsqueda de usuarios con paginación
searchUsers(searchTerm?: string, role?: string, page: number = 1, pageSize: number = 10)
  : Observable<PagedUsersResponseDto>

// Obtener detalles de usuario
getUser(userId: string): Observable<UserManageDto>

// Actualizar estado (bloqueo)
updateUserStatus(userId: string, statusData: UpdateUserStatusDto): Observable<UserManageDto>

// Actualizar rol
updateUserRole(userId: string, roleData: UpdateUserRoleDto): Observable<any>
```

**AdminUsersPage**

Características:
- Listado paginado de usuarios
- Búsqueda por email, nombre, apellido
- Filtro por rol (Customer, Owner, Admin)
- Modal para editar rol de usuario
- Modal para bloquear usuario con razón y fecha
- Acción Desbloquear usuario
- Indicadores visuales: estado activo/bloqueado, rol, email verificado
- Estados de carga con spinners
- Notificaciones toast para acciones

DTOs Utilizados:
```typescript
interface UserManageDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  profilePictureUrl?: string;
  isEmailVerified: boolean;
  isBlocked: boolean;
  blockReason?: string;
  blockUntil?: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface PagedUsersResponseDto {
  users: UserManageDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

interface UpdateUserStatusDto {
  isBlocked: boolean;
  blockReason?: string;
  blockUntil?: string;
}

interface UpdateUserRoleDto {
  role: string;
}
```

---

## Servicios

### ApiService (core/services/api.service.ts)

Configuración base para todas las llamadas HTTP.

```typescript
export class ApiService {
  readonly apiBaseUrl = environment.apiBaseUrl;
  // Métodos auxiliares para construcción de URLs
}
```

### AuthSessionService (core/services/auth-session.service.ts)

Gestión de autenticación y sesión.

```typescript
export class AuthSessionService {
  isAuthenticated(): boolean
  getToken(): string | null
  setTokens(response: AuthResponseDto): void
  logout(): void
  getCurrentUser(): User | null
}
```

### NotifyService (core/services/notify.service.ts)

Notificaciones y alertas para usuario.

```typescript
export class NotifyService {
  showSuccess(message: string): void
  showError(message: string): void
  showWarning(message: string): void
}
```

### UserService (features/account/services/user.service.ts)

Operaciones de perfil de usuario.

```typescript
export class UserService {
  getProfile(): Observable<UserProfileDto>
  updateProfile(data: UpdateUserProfileDto): Observable<UserProfileDto>
  changePassword(data: ChangePasswordDto): Observable<void>
}
```

### AdminUsersService (features/admin/services/admin-users.service.ts)

Operaciones de administración de usuarios. **[NUEVO]**

```typescript
export class AdminUsersService {
  searchUsers(...params): Observable<PagedUsersResponseDto>
  getUser(userId: string): Observable<UserManageDto>
  updateUserStatus(userId: string, ...): Observable<UserManageDto>
  updateUserRole(userId: string, ...): Observable<any>
}
```

---

## Componentes Principales

### LoginPage (features/auth/pages/login/login.page.ts)

- Formulario reactivo con validaciones
- Integración con AuthService
- Manejo de errores centralizado

### RegisterPage (features/auth/pages/register/register.page.ts)

- Formulario multi-paso (datos personales, contraseña)
- Validaciones complejas
- Integración con AuthService

### HomePage (home/home.page.ts)

- Dashboard principal post-login
- Accesos rápidos a funcionalidades
- Estado inicial con carga de datos

### ProfilePage (features/account/pages/profile/profile.page.ts)

- Dos tabs: Información Personal + Seguridad
- Edición de datos personales
- Cambio de contraseña
- Estado e indicador de validación en vivo

### AdminUsersPage (features/admin/pages/admin-users.page.ts) **[NUEVO]**

- Listado paginado de usuarios
- Búsqueda y filtros
- Modales para edición (rol) y bloqueo
- Indicadores visuales de estado

---

## Guardias de Ruta

### AuthGuard (core/guards/auth.guard.ts)

Protege rutas que requieren autenticación.

```typescript
export const authGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  return authSession.isAuthenticated() ? true : false;
};
```

Uso en rutas privadas:
```typescript
{
  path: 'home',
  loadComponent: () => import('...').then(m => m.HomePage),
  canActivate: [authGuard],
}
```

---

## Interceptores

### AuthInterceptor (core/interceptors/auth.interceptor.ts)

Agrega el token JWT a todas las peticiones autenticadas.

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(AuthSessionService);
  const token = authSession.getToken();
  
  if (token && this.isAuthUrl(req.url)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
```

### ErrorInterceptor (core/interceptors/error.interceptor.ts)

Maneja errores HTTP de forma centralizada.

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejo de errores por status code
      // 401: Redirecta a login
      // 403: Muestra error de permisos
      // 5xx: Muestra error genérico
    })
  );
};
```

---

## Enrutamiento

### Rutas Principales (src/main.ts)

```typescript
const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  // Autenticación
  { path: 'auth/login', loadComponent: LoginPage },
  { path: 'auth/register', loadComponent: RegisterPage },
  
  // Público/Autenticado
  { path: 'home', loadComponent: HomePage, canActivate: [authGuard] },
  { path: 'profile', loadComponent: ProfilePage, canActivate: [authGuard] },
  
  // Operaciones de cliente
  { path: 'appointments', loadComponent: AppointmentsListPage, canActivate: [authGuard] },
  { path: 'businesses', loadComponent: BusinessListPage, canActivate: [authGuard] },
  { path: 'businesses/:id', loadComponent: BusinessDetailPage, canActivate: [authGuard] },
  
  // Operaciones de propietario
  { path: 'owner/businesses', loadComponent: BusinessListPage, canActivate: [authGuard] },
  { path: 'owner/businesses/:id/settings', loadComponent: BusinessSettingsPage, canActivate: [authGuard] },
  
  // Administración (NUEVO)
  { path: 'admin/users', loadComponent: AdminUsersPage, canActivate: [authGuard] },
];
```

**Nota:** Las rutas de admin (ej: `/admin/users`) están configuradas pero actualmente sin validación de rol en el frontend. La validación se realiza en backend via `[Authorize(Roles = "Admin")]`.

---

## Configuración de Entorno

### environment.ts (Desarrollo)

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7187'
};
```

### environment.prod.ts (Producción)

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.turnoya.com'
};
```

---

## Próximos Pasos

1. Implementar validación de rol en frontend (directiva o guard)
2. Crear componente para seleccionar rol/negocio en login
3. Agregar más operaciones admin (reportes, análisis)
4. Implementar notificaciones en tiempo real (WebSocket)
5. Testing unitario y E2E

