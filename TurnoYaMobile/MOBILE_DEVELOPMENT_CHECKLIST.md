# TurnoYa Mobile App - Checklist de Desarrollo

> Guía paso a paso para desarrollar la aplicación móvil de TurnoYa con Ionic + Capacitor, consumiendo la API .NET 8.

---

## 📋 Índice de Fases

- [Fase 1: Configuración Inicial del Proyecto](#fase-1-configuración-inicial-del-proyecto)
- [Fase 2: Arquitectura y Estructura Base](#fase-2-arquitectura-y-estructura-base)
- [Fase 3: Autenticación y Guards](#fase-3-autenticación-y-guards)
- [Fase 4: Módulo de Negocios](#fase-4-módulo-de-negocios)
- [Fase 5: Módulo de Citas](#fase-5-módulo-de-citas)
- [Fase 6: Módulo de Pagos](#fase-6-módulo-de-pagos)
- [Fase 7: Perfil de Usuario y Configuración](#fase-7-perfil-de-usuario-y-configuración)
- [Fase 8: UI/UX y Componentes Compartidos](#fase-8-uiux-y-componentes-compartidos)
- [Fase 9: Testing y Optimización](#fase-9-testing-y-optimización)
- [Fase 10: Build Nativo y Deploy](#fase-10-build-nativo-y-deploy)

---

## Fase 1: Configuración Inicial del Proyecto

### 1.1 Instalación de Herramientas
- [x] Instalar Node.js (v18 o superior) ✅ v22.18.0
  ```bash
  node --version
  npm --version
  ```
- [x] Instalar Ionic CLI ✅
  ```bash
  npm install -g @ionic/cli
  ```
- [x] Instalar Capacitor CLI ✅
  ```bash
  npm install -g @capacitor/cli
  ```
- [X] Instalar Android Studio (para Android)
- [ ] Instalar Xcode (para iOS - solo macOS)

### 1.2 Crear Proyecto Ionic
- [x] Crear proyecto con Ionic + Angular ✅
  ```bash
  cd c:\Users\USUARIO\Desktop\Perfil_Profesional\Proyectos\TurnoYa
  ionic start TurnoYaMobile blank --type=angular --capacitor
  cd TurnoYaMobile
  ```
- [x] Verificar estructura inicial ✅
  ```bash
  npm run start
  ```
- [x] Probar en navegador (http://localhost:4200) ✅

### 1.3 Configurar Capacitor
- [ ] Agregar plataformas nativas
  ```bash
  ionic capacitor add android
  ionic capacitor add ios  # solo en macOS
  ```
- [ ] Configurar `capacitor.config.ts`
  - [ ] Configurar `appId`, `appName`, `webDir`
  - [ ] Configurar server (para desarrollo local)

### 1.4 Instalar Dependencias Base
- [ ] Instalar HTTP Client (ya viene en Angular)
- [ ] Instalar Storage para JWT
  ```bash
  npm install @ionic/storage-angular
  ```
- [ ] Instalar RxJS utilities
  ```bash
  npm install rxjs
  ```
- [ ] Instalar date utilities
  ```bash
  npm install date-fns
  ```
- [ ] Configurar environment files
  - [ ] `src/environments/environment.ts` (desarrollo)

---

## Fase 2: Arquitectura y Estructura Base
### 2.1 Estructura de Carpetas
- [ ] Crear estructura modular
  ```
  src/
  │   ├── core/              # Servicios singleton, guards, interceptors
  │   │   ├── guards/
  │   │   ├── interceptors/
  │   │   ├── services/
  │   │   ├── components/
  │   │   ├── pipes/
  │   │   └── directives/
  │   │   ├── business/
  │   │   ├── appointments/
  │   │   ├── payments/
  │   └── app.component.ts
  ```

- [ ] Crear `core/models/user.model.ts`
  ```typescript
  export interface User {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
  }
  export enum UserRole {
    Customer = 'Customer',
    BusinessOwner = 'BusinessOwner',
    Employee = 'Employee',
    Admin = 'Admin'
  }
  ```
- [ ] Crear `core/models/auth.model.ts`
  ```typescript
  export interface LoginRequest {
    email: string;
    password: string;
  }
  export interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }
    token: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
  }
  ```
- [ ] Crear `core/models/business.model.ts`
- [ ] Crear `core/models/appointment.model.ts`
- [ ] Crear `core/models/payment.model.ts`
- [ ] Crear `core/models/api-response.model.ts`
  ```typescript
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
  }

### 2.3 Configurar Environments
- [ ] Configurar `environment.ts`
  ```typescript
  export const environment = {
    production: false,
    apiUrl: 'http://localhost:5000/api',  // Tu backend local
    tokenKey: 'turnoYa_token',
    refreshTokenKey: 'turnoYa_refresh_token'
  };
  ```
- [ ] Configurar `environment.prod.ts`
  ```typescript
  export const environment = {
    production: true,
    apiUrl: 'https://api.turnoya.com/api',  // Tu backend en producción
    tokenKey: 'turnoYa_token',
    refreshTokenKey: 'turnoYa_refresh_token'
  };
  ```

### 3.1 Storage Service
- [ ] Crear `core/services/storage.service.ts`
  ```bash
  ionic generate service core/services/storage
  ```
- [ ] Implementar métodos:
  - [ ] `init()` - Inicializar storage
  - [ ] `set(key, value)` - Guardar dato
  - [ ] `get(key)` - Obtener dato
  - [ ] `clear()` - Limpiar todo
- [ ] Inicializar en `app.component.ts` (constructor)

### 3.2 Auth Service
- [x] Crear `core/services/auth.service.ts` ✅
  ```bash
  ionic generate service core/services/auth
  ```
  - [x] `register(data: RegisterRequest): Observable<AuthResponse>` ✅
  - [x] `login(data: LoginRequest): Observable<AuthResponse>` ✅
  - [x] `logout(): Promise<void>` ✅
  - [x] `refreshToken(): Observable<AuthResponse>` ✅
  - [x] `isAuthenticated(): Promise<boolean>` ✅
  - [x] `getCurrentUser(): Observable<User | null>` ✅
  - [x] `getToken(): Promise<string | null>` ✅
  - [x] `saveToken(token: string): Promise<void>` ✅
  - [x] `saveRefreshToken(token: string): Promise<void>` ✅
- [x] Implementar BehaviorSubject para estado de autenticación ✅
  ```typescript
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  ```

### 3.3 HTTP Interceptor (JWT)
- [x] Crear `core/interceptors/auth.interceptor.ts` ✅
  ```bash
  ionic generate interceptor core/interceptors/auth
  ```
- [x] Implementar lógica: ✅
  - [x] Agregar token a headers (`Authorization: Bearer ${token}`) ✅
  - [x] Excluir rutas públicas (login, register) ✅
  - [x] Manejar refresh token automático en caso de 401 ✅
- [x] Registrar interceptor en `main.ts` ✅

### 3.4 Error Interceptor
- [x] Crear `core/interceptors/error.interceptor.ts` ✅
- [x] Implementar manejo de errores HTTP: ✅
  - [x] 400 - Validación ✅
  - [x] 401 - No autorizado (logout) ✅
  - [x] 403 - Forbidden ✅
  - [x] 404 - No encontrado ✅
  - [x] 500 - Error de servidor ✅
- [x] Mostrar alertas/toasts con mensajes de error ✅

### 3.5 Auth Guard
- [x] Crear `core/guards/auth.guard.ts` ✅
  ```bash
  ionic generate guard core/guards/auth
  ```
- [x] Implementar `CanActivate`: ✅
  - [x] Verificar si usuario está autenticado ✅
  - [x] Redirigir a `/login` si no lo está ✅
- [x] Crear `core/guards/role.guard.ts` ✅
  - [x] Verificar roles específicos (BusinessOwner, Customer) ✅

### 3.6 Páginas de Autenticación
- [x] Crear módulo auth ✅
  ```bash
  ionic generate module features/auth
  ionic generate page features/auth/login
  ionic generate page features/auth/register
  ```
- [x] **Login Page** ✅
  - [x] Formulario con email y password ✅
  - [x] Validaciones (ReactiveFormsModule) ✅
  - [x] Botón "Iniciar Sesión" ✅
  - [x] Link a "Registrarse" ✅
  - [ ] Link "¿Olvidaste tu contraseña?" (opcional)
  - [x] Loading spinner durante login ✅
  - [x] Navegar a `/home` después de login exitoso ✅
- [x] **Register Page** ✅
  - [x] Formulario completo (email, password, confirmPassword, firstName, lastName, phone, role) ✅
  - [x] Validaciones (incluyendo password matching) ✅
  - [x] Botón "Registrarse" ✅
  - [x] Link a "Ya tengo cuenta" ✅
  - [x] Navegar a `/home` después de registro exitoso ✅

### 3.7 Configurar Rutas
- [x] Configurar rutas en `app.routes.ts` ✅
  ```typescript
  const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', loadComponent: () => import('./features/auth/login/login.page').then(m => m.LoginPage) },
    { path: 'register', loadComponent: () => import('./features/auth/register/register.page').then(m => m.RegisterPage) },
    { 
      path: 'home', 
      canActivate: [authGuard],
      loadComponent: () => import('./features/home/home.page').then(m => m.HomePage) 
    }
  ];
  ```
- [x] Implementar guards en rutas protegidas ✅

---

## Fase 4: Módulo de Negocios

### 4.1 Modelos de Negocio
- [ ] Crear `core/models/business.model.ts`
  ```typescript
  export interface Business {
    id: string;
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    rating?: number;
    totalReviews?: number;
    ownerId: string;
    categoryId: string;
    category?: Category;
    workingHours?: WorkingHours;
    services?: Service[];
  }
  export interface Category {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
  }
  export interface Service {
    id: string;
    businessId: string;
    name: string;
    description?: string;
    duration: number;  // minutos
    price: number;
    currency: string;
    isActive: boolean;
  }
  export interface WorkingHours {
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    // ... resto de días
  }
  export interface DaySchedule {
    isOpen: boolean;
    openTime: string;  // "09:00"
    closeTime: string; // "18:00"
  }
  ```

### 4.2 Business Service
- [ ] Crear `core/services/business.service.ts`
  ```bash
  ionic generate service core/services/business
  ```
- [ ] Implementar métodos:
  - [ ] `getAll(filters?): Observable<Business[]>`
  - [ ] `getById(id: string): Observable<Business>`
  - [ ] `getMyBusinesses(): Observable<Business[]>` (para owners)
  - [ ] `create(data: CreateBusinessDto): Observable<Business>`
  - [ ] `update(id: string, data: UpdateBusinessDto): Observable<Business>`
  - [ ] `delete(id: string): Observable<void>`
  - [ ] `getServices(businessId: string): Observable<Service[]>`

### 4.3 Páginas de Negocios
- [ ] Crear páginas
  ```bash
  ionic generate page features/business/list
  ionic generate page features/business/detail
  ionic generate page features/business/create
  ```
- [ ] **Business List Page**
  - [ ] Lista de negocios (ion-list + ion-item)
  - [ ] Búsqueda por nombre
  - [ ] Filtros por categoría
  - [ ] Card con imagen, nombre, rating, dirección
  - [ ] Click → navegar a detalle
  - [ ] Pull-to-refresh
  - [ ] Infinite scroll (paginación)
- [ ] **Business Detail Page**
  - [ ] Header con imagen de portada
  - [ ] Información del negocio
  - [ ] Lista de servicios con precios
  - [ ] Botón "Agendar Cita"
  - [ ] Horarios de atención
  - [ ] Mapa de ubicación (opcional)
  - [ ] Reseñas (después)
- [ ] **Business Create/Edit Page** (solo para BusinessOwner)
  - [ ] Formulario completo
  - [ ] Upload de logo y portada (Capacitor Camera)
  - [ ] Configurar horarios
  - [ ] Agregar servicios

### 4.4 Componentes Compartidos de Negocio
- [ ] Crear `shared/components/business-card/business-card.component.ts`
  - [ ] Input: Business
  - [ ] Output: Click event
  - [ ] Mostrar thumbnail, nombre, rating, ubicación
- [ ] Crear `shared/components/service-card/service-card.component.ts`
  - [ ] Input: Service
  - [ ] Mostrar nombre, duración, precio
  - [ ] Botón "Seleccionar"

---

## Fase 5: Módulo de Citas

### 5.1 Modelos de Cita
- [ ] Crear `core/models/appointment.model.ts`
  ```typescript
  export interface Appointment {
    id: string;
    businessId: string;
    serviceId: string;
    employeeId?: string;
    userId: string;
    startDate: string;  // ISO 8601
    endDate: string;
    status: AppointmentStatus;
    notes?: string;
    reference: string;
    paymentStatus?: PaymentStatus;
    business?: Business;
    service?: Service;
    employee?: Employee;
    user?: User;
  }
  export enum AppointmentStatus {
    Pending = 'Pending',
    Confirmed = 'Confirmed',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
    NoShow = 'NoShow'
  }
  export enum PaymentStatus {
    Pending = 'Pending',
    Paid = 'Paid',
    Failed = 'Failed',
    Refunded = 'Refunded'
  }
  export interface CreateAppointmentDto {
    businessId: string;
    serviceId: string;
    employeeId?: string;
    startDate: string;
    notes?: string;
  }
  export interface AvailabilitySlot {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }
  ```

### 5.2 Appointment Service
- [ ] Crear `core/services/appointment.service.ts`
  ```bash
  ionic generate service core/services/appointment
  ```
- [ ] Implementar métodos:
  - [ ] `getMyAppointments(status?): Observable<Appointment[]>`
  - [ ] `getBusinessAppointments(businessId, filters?): Observable<Appointment[]>`
  - [ ] `getById(id: string): Observable<Appointment>`
  - [ ] `create(data: CreateAppointmentDto): Observable<Appointment>`
  - [ ] `confirm(id: string): Observable<Appointment>`
  - [ ] `cancel(id: string): Observable<Appointment>`
  - [ ] `complete(id: string): Observable<Appointment>`
  - [ ] `markNoShow(id: string): Observable<Appointment>`
  - [ ] `getAvailability(businessId, serviceId, date): Observable<AvailabilitySlot[]>`

### 5.3 Páginas de Citas
- [ ] Crear páginas
  ```bash
  ionic generate page features/appointments/list
  ionic generate page features/appointments/detail
  ionic generate page features/appointments/create
  ```
- [ ] **Appointment List Page** (Mis Citas)
  - [ ] Tab/segment para filtrar (Próximas, Pasadas, Canceladas)
  - [ ] Lista de citas con card
  - [ ] Mostrar servicio, negocio, fecha/hora, estado
  - [ ] Acciones: Ver detalle, Cancelar
  - [ ] Pull-to-refresh
  - [ ] Estado vacío ("No tienes citas")
- [ ] **Appointment Detail Page**
  - [ ] Información completa de la cita
  - [ ] Detalles del servicio
  - [ ] Información del negocio
  - [ ] Estado de pago
  - [ ] Botones de acción según estado:
    - Pending → Cancelar
    - Confirmed → Ver detalles / Cancelar
    - Completed → Dejar reseña
  - [ ] Mapa/dirección del negocio
- [ ] **Appointment Create Page** (Agendar Cita)
  - [ ] Paso 1: Seleccionar servicio (desde business detail)
  - [ ] Paso 2: Seleccionar fecha (ion-datetime)
  - [ ] Paso 3: Seleccionar hora disponible (grid de slots)
  - [ ] Paso 4: Notas opcionales
  - [ ] Paso 5: Confirmar y crear
  - [ ] Mostrar resumen antes de confirmar
  - [ ] Loading durante creación
  - [ ] Navegar a detalle después de crear

### 5.4 Componentes de Cita
- [ ] Crear `shared/components/appointment-card/appointment-card.component.ts`
  - [ ] Input: Appointment
  - [ ] Mostrar resumen de cita
  - [ ] Badge de estado (color según status)
- [ ] Crear `shared/components/time-slot-selector/time-slot-selector.component.ts`
  - [ ] Input: AvailabilitySlot[]
  - [ ] Output: selected slot
  - [ ] Grid de horarios clickeables
  - [ ] Marcar disponibles/no disponibles

---

## Fase 6: Módulo de Pagos

### 6.1 Modelos de Pago
- [ ] Crear `core/models/payment.model.ts`
  ```typescript
  export interface PaymentIntent {
    appointmentId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
  }
  export interface Payment {
    id: string;
    appointmentId: string;
    amount: number;
    currency: string;
    status: string;
    transactionId?: string;
    paymentMethod?: string;
    createdAt: string;
  }
  ```

### 6.2 Payment Service
- [ ] Crear `core/services/payment.service.ts`
- [ ] Implementar métodos:
  - [ ] `createPaymentIntent(data: PaymentIntent): Observable<any>`
  - [ ] `getPaymentStatus(transactionId: string): Observable<Payment>`
  - [ ] `processPayment(appointmentId: string): Observable<Payment>`

### 6.3 Páginas de Pago
- [ ] Crear páginas
  ```bash
  ionic generate page features/payments/checkout
  ionic generate page features/payments/success
  ionic generate page features/payments/failed
  ```
- [ ] **Checkout Page**
  - [ ] Resumen de la cita
  - [ ] Monto a pagar
  - [ ] Integración con Wompi (WebView o SDK)
  - [ ] Botón "Pagar"
- [ ] **Success Page**
  - [ ] Mensaje de éxito
  - [ ] Detalles de la transacción
  - [ ] Botón "Ver mi cita"
- [ ] **Failed Page**
  - [ ] Mensaje de error
  - [ ] Opción de reintentar
  - [ ] Botón "Volver"

---

## Fase 7: Perfil de Usuario y Configuración

### 7.1 Profile Service
- [ ] Crear `core/services/profile.service.ts`
- [ ] Implementar métodos:
  - [ ] `getProfile(): Observable<User>`
  - [ ] `updateProfile(data): Observable<User>`
  - [ ] `uploadProfilePicture(file): Observable<string>`
  - [ ] `changePassword(oldPassword, newPassword): Observable<void>`

### 7.2 Páginas de Perfil
- [ ] Crear páginas
  ```bash
  ionic generate page features/profile/view
  ionic generate page features/profile/edit
  ```
- [ ] **Profile View Page**
  - [ ] Avatar/foto de perfil
  - [ ] Nombre, email, teléfono
  - [ ] Botón "Editar perfil"
  - [ ] Botón "Cerrar sesión"
  - [ ] Opciones: Cambiar contraseña, Notificaciones
  - [ ] Link a Mis Negocios (si es owner)
- [ ] **Profile Edit Page**
  - [ ] Formulario editable
  - [ ] Cambiar foto (Capacitor Camera)
  - [ ] Validaciones
  - [ ] Botón "Guardar cambios"

---

## Fase 8: UI/UX y Componentes Compartidos

### 8.1 Tabs Navigation
- [ ] Crear tabs principales
  ```bash
  ionic generate page tabs
  ```
- [ ] Configurar tabs:
  - [ ] Tab 1: Explorar / Negocios
  - [ ] Tab 2: Mis Citas
  - [ ] Tab 3: Perfil
  - [ ] (Opcional) Tab 4: Mis Negocios (solo BusinessOwner)

### 8.2 Componentes Compartidos
- [ ] Crear `shared/components/header/header.component.ts`
  - [ ] Input: title, backButton
  - [ ] Componente reutilizable
- [ ] Crear `shared/components/loading-spinner/loading-spinner.component.ts`
- [ ] Crear `shared/components/empty-state/empty-state.component.ts`
  - [ ] Input: message, icon
- [ ] Crear `shared/components/error-message/error-message.component.ts`

### 8.3 Pipes Personalizados
- [ ] Crear `shared/pipes/time-ago.pipe.ts` (date-fns)
- [ ] Crear `shared/pipes/currency-format.pipe.ts`
- [ ] Crear `shared/pipes/status-label.pipe.ts` (traducir enums)

### 8.4 Temas y Estilos
- [ ] Configurar tema principal en `theme/variables.scss`
  - [ ] Colores primarios, secundarios
  - [ ] Dark mode support
- [ ] Crear estilos globales en `global.scss`
- [ ] Configurar tipografía y espaciados

### 8.5 Loading & Error Handling
- [ ] Crear `core/services/loading.service.ts`
  - [ ] `show(message?)`, `hide()`
  - [ ] Usar LoadingController de Ionic
- [ ] Crear `core/services/toast.service.ts`
  - [ ] `showSuccess(message)`, `showError(message)`, `showInfo(message)`
  - [ ] Usar ToastController de Ionic
- [ ] Crear `core/services/alert.service.ts`
  - [ ] `showConfirm(title, message)`, `showAlert(title, message)`
  - [ ] Usar AlertController de Ionic

---

## Fase 9: Testing y Optimización

### 9.1 Unit Testing
- [ ] Configurar Karma/Jest
- [ ] Escribir tests para servicios:
  - [ ] AuthService
  - [ ] BusinessService
  - [ ] AppointmentService
- [ ] Escribir tests para componentes críticos
- [ ] Ejecutar tests
  ```bash
  npm run test
  ```

### 9.2 E2E Testing (Opcional)
- [ ] Configurar Cypress o Playwright
- [ ] Escribir tests E2E para flujos principales:
  - [ ] Login/Register
  - [ ] Buscar negocio
  - [ ] Crear cita
  - [ ] Cancelar cita

### 9.3 Optimización de Performance
- [ ] Implementar lazy loading en rutas
- [ ] Optimizar imágenes (lazy loading, WebP)
- [ ] Implementar virtual scrolling para listas largas
- [ ] Cachear respuestas HTTP (HttpCacheInterceptor)
- [ ] Minimizar bundle size
  ```bash
  ionic build --prod
  npx webpack-bundle-analyzer dist/stats.json
  ```

### 9.4 Manejo de Offline
- [ ] Implementar Service Worker (PWA)
- [ ] Cachear datos críticos en Storage
- [ ] Mostrar mensaje cuando esté offline
- [ ] Sincronizar cambios cuando vuelva online

---

## Fase 10: Build Nativo y Deploy

### 10.1 Configurar Capacitor
- [ ] Sincronizar código web con nativo
  ```bash
  ionic build --prod
  npx cap sync
  ```
- [ ] Configurar permisos en `android/app/src/main/AndroidManifest.xml`
  - [ ] INTERNET
  - [ ] CAMERA (si usas cámara)
  - [ ] WRITE_EXTERNAL_STORAGE (para guardar imágenes)
- [ ] Configurar permisos en `ios/App/App/Info.plist` (si aplica)

### 10.2 Build Android
- [ ] Abrir proyecto en Android Studio
  ```bash
  npx cap open android
  ```
- [ ] Configurar `build.gradle` (versionCode, versionName)
- [ ] Generar keystore para firma
  ```bash
  keytool -genkey -v -keystore turnoYa-release-key.keystore -alias turnoYa -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Configurar firma en `android/app/build.gradle`
- [ ] Generar APK/AAB
  - [ ] Build → Generate Signed Bundle / APK
- [ ] Probar APK en dispositivo físico

### 10.3 Build iOS (macOS)
- [ ] Abrir proyecto en Xcode
  ```bash
  npx cap open ios
  ```
- [ ] Configurar Bundle Identifier
- [ ] Configurar equipo de desarrollo (Apple Developer)
- [ ] Configurar certificados y provisioning profiles
- [ ] Build y probar en simulador
- [ ] Archive para distribución

### 10.4 Deploy a Stores
- [ ] **Google Play Store**
  - [ ] Crear cuenta de desarrollador
  - [ ] Preparar assets (capturas, descripción, ícono)
  - [ ] Subir AAB a Google Play Console
  - [ ] Configurar listing
  - [ ] Publicar en prueba interna → prueba cerrada → producción
- [ ] **Apple App Store**
  - [ ] Crear cuenta de desarrollador Apple
  - [ ] Preparar assets
  - [ ] Subir build a App Store Connect
  - [ ] Configurar listing
  - [ ] Enviar a revisión

### 10.5 CI/CD (Opcional)
- [ ] Configurar GitHub Actions / GitLab CI
- [ ] Pipeline para build automático
- [ ] Pipeline para tests
- [ ] Deploy automático a Firebase Hosting (web)
- [ ] Deploy automático a stores (fastlane)

---

## 📝 Notas Importantes

### Endpoints de la API a Consumir

**Base URL**: `http://localhost:5000/api` (desarrollo)

#### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/revoke/{userId}` - Revocar token

#### Negocios
- `GET /businesses` - Listar negocios
- `GET /businesses/{id}` - Detalle de negocio
- `GET /businesses/my` - Mis negocios (owner)
- `POST /businesses` - Crear negocio
- `PUT /businesses/{id}` - Actualizar negocio
- `DELETE /businesses/{id}` - Eliminar negocio

#### Servicios
- `GET /businesses/{businessId}/services` - Servicios de un negocio
- `POST /businesses/{businessId}/services` - Crear servicio
- `PUT /services/{id}` - Actualizar servicio
- `DELETE /services/{id}` - Eliminar servicio

#### Citas
- `GET /appointments/my` - Mis citas (customer)
- `GET /appointments/business/{businessId}` - Citas de negocio
- `GET /appointments/{id}` - Detalle de cita
- `POST /appointments` - Crear cita
- `PATCH /appointments/{id}/confirm` - Confirmar cita
- `PATCH /appointments/{id}/cancel` - Cancelar cita
- `PATCH /appointments/{id}/complete` - Completar cita
- `PATCH /appointments/{id}/noshow` - Marcar no show
- `GET /appointments/availability` - Horarios disponibles

#### Pagos
- `POST /payments/intent` - Crear intención de pago
- `GET /payments/status/{transactionId}` - Estado de pago
- `POST /payments/webhook` - Webhook de Wompi

### Plugins de Capacitor Recomendados
- `@capacitor/camera` - Acceso a cámara y galería
- `@capacitor/geolocation` - Ubicación GPS
- `@capacitor/local-notifications` - Notificaciones locales
- `@capacitor/push-notifications` - Notificaciones push
- `@capacitor/network` - Estado de conexión
- `@capacitor/share` - Compartir contenido
- `@capacitor/status-bar` - Personalizar status bar
- `@capacitor/splash-screen` - Splash screen

### Convenciones de Código
- Usar TypeScript estricto
- Reactive Forms para formularios complejos
- Template-driven forms para formularios simples
- RxJS operators: `map`, `catchError`, `switchMap`, `debounceTime`
- Unsubscribe de observables en `ngOnDestroy`
- Usar `async` pipe en templates cuando sea posible
- Componentes standalone o módulos (elegir uno y ser consistente)

### Estructura de Commits
```
feat: Agregar login page
fix: Corregir error en appointment service
refactor: Mejorar estructura de business list
docs: Actualizar README
style: Formatear código
test: Agregar tests para auth service
```

---

## ✅ Estado del Proyecto

**Fase Actual**: Fase 1 - Configuración Inicial

**Última Actualización**: 1 de diciembre de 2025

**Próximos Pasos**:
1. Instalar herramientas y crear proyecto Ionic
2. Configurar estructura de carpetas
3. Implementar autenticación y consumir endpoints del backend
