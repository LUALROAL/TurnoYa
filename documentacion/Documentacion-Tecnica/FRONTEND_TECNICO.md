# TurnoYa - Documentacion Tecnica Frontend

Este documento se completa punto por punto segun el checklist de frontend.

## Estado de avance
  - [x] Crear proyecto Ionic Angular
  - [x] Configurar Tailwind CSS
  - [x] Configurar entornos y API base URL
  - [x] Crear cliente HTTP base
  - [x] Implementar interceptor JWT
  - [x] Manejo global de errores HTTP
  - [x] Crear modulo/paginas de Auth
  - [x] Integrar endpoint register
  - [x] Integrar endpoint login
  - [x] Implementar refresh automatico
  - [x] Guard de rutas protegidas
  - [x] Configurar Home y navegacion inicial
  - [x] Crear pagina listado de negocios
  - [x] Implementar busqueda y filtros de negocios

## Base tecnica

## Tailwind CSS
- Dependencias: tailwindcss@3.4.17, postcss, autoprefixer (dev)
- Nota: se usa Tailwind v3 por compatibilidad con el builder de Angular.
- Config: tailwind.config.js y postcss.config.js en la raiz del proyecto
- Estilos globales: directivas Tailwind agregadas en src/global.scss
- Tokens Tech Pro: src/theme/tokens.css importado en global.scss

## Endpoints conectados
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/business
- GET /api/business/search
- GET /api/business/categories

## Guard de rutas protegidas
- Archivo: src/app/core/guards/auth.guard.ts
- Uso: canActivate en rutas privadas
- Flujo:
  - Si existe accessToken, permite acceso
  - Si no existe, redirige a /auth/login con returnUrl
- Rutas protegidas actuales:
  - /home
  - /businesses

## Home marketplace (base)
- Archivos:
  - src/app/home/home.page.ts
  - src/app/home/home.page.html
  - src/app/home/home.page.scss
- Implementado:
  - Header de bienvenida y buscador visual
  - Accesos rapidos (Negocios, Mis citas, Perfil)
  - Seccion recomendados con estado de carga y estado vacio
  - Navegacion a listado de negocios desde "Negocios" y "Ver todo"

## Listado de negocios
- Archivos:
  - src/app/features/business/models/business-list.model.ts
  - src/app/features/business/services/business.service.ts
  - src/app/features/business/pages/list/business-list.page.ts
  - src/app/features/business/pages/list/business-list.page.html
  - src/app/features/business/pages/list/business-list.page.scss
- Ruta:
  - /businesses (standalone + canActivate)
- Integracion backend:
  - GET /api/business para obtener BusinessListDto[]
  - GET /api/business/search con query, city y category
  - GET /api/business/categories para chips de filtro
- Estados UX:
  - Cargando: skeleton cards
  - Vacio: mensaje de no disponibilidad
  - Exito: tarjetas con nombre, categoria, ciudad, rating, direccion y reseñas

## Busqueda y filtros de negocios
- Archivo principal: src/app/features/business/pages/list/business-list.page.ts
- Filtros implementados:
  - Busqueda por texto (query)
  - Filtro por ciudad
  - Filtro por categoria (chips dinamicos)
- Acciones UX:
  - Boton Buscar para aplicar filtros al endpoint search
  - Boton Limpiar para resetear filtros y recargar listado general
- Servicio actualizado:
  - BusinessService.getCategories()
  - BusinessService.search({ query, city, category })

## Estructura de modelos (profesional)
- Feature auth:
  - src/app/features/auth/models/auth-request.model.ts
  - src/app/features/auth/models/auth-response.model.ts
  - src/app/features/auth/models/auth-user.model.ts
  - src/app/features/auth/models/index.ts
- Core:
  - src/app/core/models/auth-session.model.ts

## Auth UI (standalone)
- Login: src/app/features/auth/pages/login/login.page.ts
- Register: src/app/features/auth/pages/register/register.page.ts
- Servicio auth: src/app/features/auth/services/auth.service.ts
- Rutas: /auth/login, /auth/register
- Flujo inicial: / redirige a /auth/login

## Integracion register
- Endpoint: POST /api/auth/register
- Payload frontend -> backend:
  - fullName -> firstName + lastName
  - email -> email
  - password -> password y confirmPassword
  - role fijo: Customer
- Manejo de errores:
  - 400 (validacion/email duplicado) mostrado por interceptor global

## Integracion login
- Endpoint: POST /api/auth/login
- Payload frontend -> backend:
  - email -> email
  - password -> password
- Persistencia de sesion:
  - accessToken, refreshToken y expiresAt
  - user (id, email, firstName, lastName, role)
- Redireccion post login:
  - Segun rol del usuario (base actual: /home)

## Refresh automatico
- Trigger: respuesta 401 en endpoint protegido
- Flujo:
  - Intenta POST /api/auth/refresh con token + refreshToken
  - Si refresh exitoso, reintenta request original con token renovado
  - Si refresh falla con 401, limpia sesion y redirige a /auth/login
- Archivos clave:
  - src/app/features/auth/services/auth.service.ts
  - src/app/core/interceptors/error.interceptor.ts

## Manejo global de errores HTTP
- Archivo: src/app/core/interceptors/error.interceptor.ts
- Notificaciones: src/app/core/services/notify.service.ts (ToastController)
- Acciones:
  - 400: muestra mensaje del backend
  - 401: limpia sesion y redirige a /auth/login
  - 403: mensaje de permisos
  - 500+: mensaje generico

## Interceptor JWT
- Archivo: src/app/core/interceptors/auth.interceptor.ts
- Storage: localStorage (key: turnoya.session)
- Excluye rutas publicas: /api/auth/login, /api/auth/register, /api/auth/refresh, /api/payments/webhook

## Cliente HTTP base
- Ubicacion: src/app/core/services/api.service.ts
- Metodos: get, post, put, patch, delete
- Base URL: environment.apiBaseUrl
- Params: soporta query params tipados

## Entornos y API base
- Desarrollo: src/environments/environment.ts
  - apiBaseUrl: https://localhost:7187
- Produccion: src/environments/environment.prod.ts
  - apiBaseUrl: https://api.turnoya.com

## Notas de implementacion
- Proyecto inicializado con template blank.
- Bootstrap con `bootstrapApplication` y routing por `loadComponent`.
- Tailwind habilitado con tokens de diseno base (Tech Pro).
- Base URL de API definida por ambiente (dev/prod).
- Cliente HTTP base listo para servicios por modulo.
- Sesion y JWT gestionados por interceptor y storage local.
- Manejo global de errores con notificaciones por toast.
- Auth UI creada con formularios reactivos y estilo Tech Pro.
- Register conectado al backend real con contrato DTO compatible.
- Login conectado al backend real con persistencia de sesion.
- Refresh automatico implementado con retry transparente en 401.
- Modelos e interfaces movidos a carpetas models por feature/core.
- Guard de rutas aplicado en paginas privadas.
- Home base implementado siguiendo estilo Tech Pro y mockups.
- Listado de negocios conectado al backend y enlazado desde Home.
- Busqueda y filtros del listado conectados a endpoints de backend.
