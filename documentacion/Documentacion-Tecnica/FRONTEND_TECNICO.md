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
  - [x] Crear detalle de negocio
  - [x] Crear modulo owner business
  - [x] Configuracion de negocio
  - [x] CRUD servicios de negocio
  - [x] CRUD empleados de negocio
  - [x] Crear flujo agendar cita
  - [x] Mis citas (cliente)
  - [x] Agenda de negocio (owner)

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
- GET /api/business/{id}
- GET /api/business/owner/{ownerId}
- POST /api/business
- PUT /api/business/{id}
- DELETE /api/business/{id}
- GET /api/services/business/{businessId}
- GET /api/services/{id}
- POST /api/services/business/{businessId}
- PUT /api/services/{id}
- DELETE /api/services/{id}
- GET /api/employees/business/{businessId}
- GET /api/employees/{id}
- POST /api/employees/business/{businessId}
- PUT /api/employees/{id}
- DELETE /api/employees/{id}
- POST /api/appointments
- GET /api/appointments/my
- GET /api/appointments/business/{businessId}
- GET /api/appointments/{id}

## Guard de rutas protegidas
- Archivo: src/app/core/guards/auth.guard.ts
- Uso: canActivate en rutas privadas
- Flujo:
  - Si existe accessToken, permite acceso
  - Si no existe, redirige a /auth/login con returnUrl
- Rutas protegidas actuales:
  - /home
  - /businesses
  - /businesses/:id
  - /owner/businesses
  - /owner/businesses/:businessId/services
  - /owner/businesses/:businessId/services/create
  - /owner/businesses/:businessId/services/:serviceId/edit
  - /owner/businesses/:businessId/employees
  - /owner/businesses/:businessId/employees/create
  - /owner/businesses/:businessId/employees/:employeeId/edit
  - /businesses/:id/book
  - /appointments
  - /owner/businesses/:businessId/appointments

## Home marketplace (base)
- Archivos:
  - src/app/home/home.page.ts
  - src/app/home/home.page.html
  - src/app/home/home.page.scss
- Implementado:
  - Header de bienvenida y buscador visual
  - Accesos rapidos (Negocios, Mis Negocios, Mis citas, Perfil)
  - Seccion recomendados con estado de carga y estado vacio
  - Navegacion a listado de negocios desde "Negocios" y "Ver todo"
  - Navegacion a listado de mis negocios desde "Mis Negocios"

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
  - Navegacion: boton "Ver detalle" hacia /businesses/:id

## Detalle de negocio
- Archivos:
  - src/app/features/business/models/business-detail.model.ts
  - src/app/features/business/pages/detail/business-detail.page.ts
  - src/app/features/business/pages/detail/business-detail.page.html
  - src/app/features/business/pages/detail/business-detail.page.scss
- Ruta:
  - /businesses/:id (standalone + canActivate)
- Integracion backend:
  - GET /api/business/{id} para BusinessDetailDto
- Renderizado:
  - Informacion general (nombre, categoria, ciudad, rating, descripcion)
  - Contacto (direccion, telefono, email, website)
  - Servicios con duracion y precio
  - Equipo de empleados (chips)
  - Estados de carga y vacio

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
- Detalle de negocio conectado al backend y enlazado desde listado.
- Modulo owner business implementado con listado, creación, edición y configuración de negocios (UI en español).
- Modulo owner services implementado con listado, creación, edición, activación/desactivación y eliminación por negocio (UI en español).
- Modulo owner employees implementado con listado, creación, edición, activación/desactivación y eliminación por negocio (UI en español).
- Flujo de agendar cita implementado desde detalle de negocio con selección de servicio, profesional, fecha y hora.

## Modulo owner business (Mis Negocios)
- Archivos:
  - src/app/features/owner-business/models/owner-business.model.ts
  - src/app/features/owner-business/services/owner-business.service.ts
  - src/app/features/owner-business/pages/business-list/business-list.page.ts
  - src/app/features/owner-business/pages/business-list/business-list.page.html
  - src/app/features/owner-business/pages/business-list/business-list.page.scss
- Ruta:
  - /owner/businesses (standalone + canActivate)
- Integracion backend:
  - GET /api/business/owner/{ownerId} para obtener negocios del propietario autenticado
  - POST /api/business (crear nuevo negocio)
  - PUT /api/business/{id} (editar/actualizar negocio, incluyendo status)
  - DELETE /api/business/{id} (eliminar negocio)
  - PUT /api/business/{id}/settings (configuración separada)
- Estados UX:
  - Cargando: skeleton cards (3 placeholders)
  - Vacio: mensaje "Aun no tienes negocios" con boton "Crear mi primer negocio"
  - Exito: tarjetas con nombre, categoria, ciudad, rating, contacto y acciones
  - Acciones en cada card: Ver, Editar, Activar/Desactivar
- UI en español:
  - Titulo: "Mis Negocios"
  - Subtitulo: "Gestiona tus Negocios"
  - Botones: "Ver", "Editar", "Activar", "Desactivar", "Crear mi primer negocio"
  - Estados: "Activo", "Inactivo"
- Caracteristicas:
  - Floating Action Button (FAB) para crear nuevo negocio cuando hay items
  - Toggle de estado activo/inactivo con feedback visual
  - Navegacion a detalle publico desde boton "Ver"
  - Navegacion a edición desde boton "Editar"
  - Navegacion a configuración desde boton "Configurar"
  - Responsive grid: 1 columna mobile, multiples en desktop
  - Confirmación de eliminación (modal nativa del navegador)

## CRUD de negocios (Business Form)
- Archivos:
  - src/app/features/owner-business/pages/business-form/business-form.page.ts
  - src/app/features/owner-business/pages/business-form/business-form.page.html
  - src/app/features/owner-business/pages/business-form/business-form.page.scss
- Rutas:
  - /owner/businesses/create (crear nuevo negocio)
  - /owner/businesses/:id/edit (editar negocio existente)
  - Ambas standalone + canActivate
- Integracion backend:
  - POST /api/business (crear con CreateBusinessDto)
  - PUT /api/business/{id} (editar con UpdateBusinessDto)
  - DELETE /api/business/{id} (eliminar con confirmación)
- Campos del formulario:
  - Sección Información Básica:
    - Nombre (requerido, 3-100 caracteres)
    - Descripción (opcional, 500 caracteres máx)
    - Categoría (requerido, select dropdown)
    - Sitio web (opcional, URL válida)
  - Sección Ubicación:
    - Dirección (requerido, 5+ caracteres)
    - Ciudad (requerido, texto)
    - Departamento (requerido, select dropdown con 32 opciones de Colombia)
    - Latitud (opcional, número decimal)
    - Longitud (opcional, número decimal)
  - Sección Contacto:
    - Teléfono (opcional, patrón +57 300 123 4567)
    - Email (opcional, email válido)
  - Solo en edición:
    - Botón "Eliminar" con confirmación
- Categorías:
  - Salón de Belleza, Peluquería, Spa, Estética, Masajes, Consultoría, Taller Automotriz, Dentista, Médico, Otros
- Estados UX:
  - Cargando: skeleton card animado (600px min-height)
  - Formulario reactivo con validación en tiempo real
  - Mensajes de error context-aware para cada tipo de validación
  - Botón submit disabled si formulario inválido o guardando
- UI en español:
  - Crear: "Crear Negocio"
  - Editar: "Editar Negocio"
  - Botones: "Cancelar", "Eliminar", "Guardar Cambios"/"Crear Negocio"
  - Placeholders descriptivos
  - Hints y campos opcionales claramente marcados
- Validaciones:
  - Nombre: requerido, 3-100 caracteres
  - Descripción: máx 500 caracteres
  - Categoría: requerido, select validator
  - Dirección: requerido, ménimo 5 caracteres
  - Ciudad: requerido
  - Departamento: requerido
  - Teléfono: patrón regex [0-9+\-() ]*
  - Email: validador email nativo
  - Sitio web: patrón regex (https?:\/\/)?.{1,}
  - Latitud/Longitud: number con step 0.0001
- Caracteristicas:
  - Formulario reactivo con FormBuilder
  - Modo doble: crear (POST) y editar (PUT)
  - Navegación desde listado (FAB para crear, botón "Editar" para editar)
  - Confirmación nativa antes de eliminar
  - Retorno a /owner/businesses tras guardar o cancelar
  - Grid responsivo 2 columnas en desktop, 1 en mobile
  - Feedback visual de errores y deshabilitación de submit
  - Design system: glass-panel, orbs, mismo estilo que settings

## Configuracion de negocio (Business Settings)
- Archivos:
  - src/app/features/owner-business/models/business-settings.model.ts
  - src/app/features/owner-business/pages/business-settings/business-settings.page.ts
  - src/app/features/owner-business/pages/business-settings/business-settings.page.html
  - src/app/features/owner-business/pages/business-settings/business-settings.page.scss
- Ruta:
  - /owner/businesses/:id/settings (standalone + canActivate)
- Integracion backend:
  - GET /api/business/{id}/settings para obtener configuracion actual
  - PUT /api/business/{id}/settings para actualizar (solo propietario)
- Campos del formulario:
  - Reservas:
    - Dias de anticipacion maxima (1-365 dias)
    - Duracion de cita por defecto (5-480 minutos)
    - Tiempo de separacion entre citas (0-120 minutos)
  - Cancelaciones:
    - Horas minimas para cancelar sin cargo (0-168 horas)
    - Politica de no-show (textarea)
  - Pagos:
    - Requiere deposito (checkbox)
- Estados UX:
  - Cargando: skeleton card animado
  - Formulario: validacion en tiempo real con mensajes de error
  - Guardando: boton disabled con texto "Guardando..."
- UI en espanol:
  - Titulo: "Ajustes del Negocio"
  - Secciones: "Reservas", "Cancelaciones", "Pagos"
  - Botones: "Cancelar", "Guardar Cambios"
  - Hints descriptivos en cada campo
- Validaciones:
  - Campos numericos con rangos especificos
  - Validacion requerida en campos criticos
  - Feedback visual con clase .invalid
- Caracteristicas:
  - Formulario reactivo con FormBuilder
  - Navegacion desde listado de negocios (boton "Configurar")
  - Navegacion de retorno a /owner/businesses tras guardar
  - Design system coherente con glass-panel y orbs

## CRUD servicios de negocio (Owner Services)
- Archivos:
  - src/app/features/owner-services/models/owner-service.model.ts
  - src/app/features/owner-services/models/index.ts
  - src/app/features/owner-services/services/owner-services.service.ts
  - src/app/features/owner-services/pages/services-list/services-list.page.ts
  - src/app/features/owner-services/pages/services-list/services-list.page.html
  - src/app/features/owner-services/pages/services-list/services-list.page.scss
  - src/app/features/owner-services/pages/service-form/service-form.page.ts
  - src/app/features/owner-services/pages/service-form/service-form.page.html
  - src/app/features/owner-services/pages/service-form/service-form.page.scss
  - src/app/features/owner-services/pages/index.ts
- Rutas:
  - /owner/businesses/:businessId/services (listado)
  - /owner/businesses/:businessId/services/create (crear)
  - /owner/businesses/:businessId/services/:serviceId/edit (editar)
  - Todas standalone + canActivate
- Integracion backend:
  - GET /api/services/business/{businessId} para listar servicios del negocio
  - GET /api/services/{id} para cargar servicio en edición
  - POST /api/services/business/{businessId} para crear servicio
  - PUT /api/services/{id} para actualizar servicio
  - DELETE /api/services/{id} para eliminar servicio
- Campos del formulario:
  - Nombre (requerido, 3-120 caracteres)
  - Descripción (opcional, máx 500)
  - Precio (requerido, decimal >= 0)
  - Duración en minutos (requerido, entero >= 5)
  - Requiere anticipo (checkbox)
  - Valor anticipo (condicional cuando requiere anticipo)
  - Servicio activo (solo edición)
- Estados UX:
  - Cargando: skeleton cards en listado y skeleton en formulario
  - Vacio: mensaje con CTA "Crear servicio"
  - Exito: tarjetas con precio, duración, anticipo y estado activo/inactivo
  - Errores: toast mediante NotifyService
- UI en español:
  - Titulo listado: "Servicios del negocio"
  - Titulo formulario: "Crear Servicio" / "Editar Servicio"
  - Botones: "Crear servicio", "Editar", "Activar/Desactivar", "Eliminar", "Cancelar"
- Caracteristicas:
  - Acceso desde "Mis Negocios" con nuevo botón "Servicios" en cada card
  - FAB para crear servicio desde listado
  - Activación/desactivación rápida desde tarjeta
  - Eliminación con confirmación nativa
  - Navegación de retorno a /owner/businesses/:businessId/services tras guardar/cancelar

## CRUD empleados de negocio (Owner Employees)
- Archivos:
  - src/app/features/owner-employees/models/owner-employee.model.ts
  - src/app/features/owner-employees/models/index.ts
  - src/app/features/owner-employees/services/owner-employees.service.ts
  - src/app/features/owner-employees/pages/employees-list/employees-list.page.ts
  - src/app/features/owner-employees/pages/employees-list/employees-list.page.html
  - src/app/features/owner-employees/pages/employees-list/employees-list.page.scss
  - src/app/features/owner-employees/pages/employee-form/employee-form.page.ts
  - src/app/features/owner-employees/pages/employee-form/employee-form.page.html
  - src/app/features/owner-employees/pages/employee-form/employee-form.page.scss
  - src/app/features/owner-employees/pages/index.ts
- Rutas:
  - /owner/businesses/:businessId/employees (listado)
  - /owner/businesses/:businessId/employees/create (crear)
  - /owner/businesses/:businessId/employees/:employeeId/edit (editar)
  - Todas standalone + canActivate
- Integracion backend:
  - GET /api/employees/business/{businessId} para listar empleados del negocio
  - GET /api/employees/{id} para cargar empleado en edición
  - POST /api/employees/business/{businessId} para crear empleado
  - PUT /api/employees/{id} para actualizar empleado
  - DELETE /api/employees/{id} para eliminar empleado
- Campos del formulario:
  - Nombres (requerido, 2-80 caracteres)
  - Apellidos (requerido, 2-80 caracteres)
  - Cargo (opcional, máx 120)
  - Teléfono (opcional, patrón [0-9+\-() ]*)
  - Email (opcional, formato válido)
  - Foto de perfil por URL (opcional)
  - Biografía (opcional, máx 500)
  - Empleado activo (solo edición)
- Estados UX:
  - Cargando: skeleton cards en listado y skeleton en formulario
  - Vacio: mensaje con CTA "Crear empleado"
  - Exito: tarjetas con nombre, cargo, contacto y estado activo/inactivo
  - Errores: toast mediante NotifyService
- UI en español:
  - Titulo listado: "Equipo del negocio"
  - Titulo formulario: "Crear Empleado" / "Editar Empleado"
  - Botones: "Crear empleado", "Editar", "Activar/Desactivar", "Eliminar", "Cancelar"
- Caracteristicas:
  - Acceso desde "Mis Negocios" con nuevo botón "Empleados" en cada card
  - FAB para crear empleado desde listado
  - Activación/desactivación rápida desde tarjeta
  - Eliminación con confirmación nativa
  - Navegación de retorno a /owner/businesses/:businessId/employees tras guardar/cancelar

## Crear flujo agendar cita
- Archivos:
  - src/app/features/appointments/models/appointment.model.ts
  - src/app/features/appointments/models/index.ts
  - src/app/features/appointments/services/appointments.service.ts
  - src/app/features/appointments/pages/appointment-create/appointment-create.page.ts
  - src/app/features/appointments/pages/appointment-create/appointment-create.page.html
  - src/app/features/appointments/pages/appointment-create/appointment-create.page.scss
  - src/app/features/business/pages/detail/business-detail.page.html
- Ruta:
  - /businesses/:id/book (standalone + canActivate)
- Integracion backend:
  - POST /api/appointments para crear cita
  - GET /api/business/{id} para precargar servicios y profesionales del negocio
- Flujo implementado:
  - Desde detalle de negocio, botón "Agendar cita"
  - Selección de servicio (obligatorio)
  - Selección de profesional (opcional, "Sin preferencia")
  - Selección de fecha y hora (obligatorio)
  - Campo de notas opcional (máx 500)
  - Validación de fecha/hora futura antes de enviar
  - Redirección al detalle de negocio al crear exitosamente
- Estados UX:
  - Cargando: skeleton del formulario
  - Error: toast si no se puede cargar negocio o crear cita
  - Guardando: botón deshabilitado con estado "Agendando..."

## Mis citas (cliente)
- Archivos:
  - src/app/features/appointments/pages/appointments-list/appointments-list.page.ts
  - src/app/features/appointments/pages/appointments-list/appointments-list.page.html
  - src/app/features/appointments/pages/appointments-list/appointments-list.page.scss
  - src/app/home/home.page.ts
- Ruta:
  - /appointments (standalone + canActivate)
- Integracion backend:
  - GET /api/appointments/my para cargar citas del usuario
- Estados UX:
  - Cargando: skeleton cards
  - Vacio: mensaje con CTA "Buscar negocios"
  - Exito: tarjetas con referencia, fecha/hora, estado y total
  - Error: toast si no se pueden cargar las citas
- UI en español:
  - Titulo: "Mis citas"
  - Estado: "Pendiente", "Confirmada", "Completada", "Cancelada", "No asistió"
- Caracteristicas:
  - Acceso desde Home en el acceso rápido "Mis citas"
  - Refresh al volver a la vista (ionViewWillEnter)

## Agenda de negocio (owner)
- Archivos:
  - src/app/features/owner-appointments/pages/appointments-list/owner-appointments-list.page.ts
  - src/app/features/owner-appointments/pages/appointments-list/owner-appointments-list.page.html
  - src/app/features/owner-appointments/pages/appointments-list/owner-appointments-list.page.scss
  - src/app/features/appointments/services/appointments.service.ts
  - src/app/features/owner-business/pages/business-list/business-list.page.html
- Ruta:
  - /owner/businesses/:businessId/appointments (standalone + canActivate)
- Integracion backend:
  - GET /api/appointments/business/{businessId} para cargar la agenda del negocio
- Estados UX:
  - Cargando: skeleton cards
  - Vacio: mensaje con CTA "Ver servicios"
  - Exito: tarjetas con referencia, fecha/hora, estado y total
  - Error: toast si no se puede cargar la agenda
- UI en español:
  - Titulo: "Agenda del negocio"
  - Estado: "Pendiente", "Confirmada", "Completada", "Cancelada", "No asistió"
- Caracteristicas:
  - Acceso desde "Mis Negocios" en el botón "Agenda"
  - Refresh al volver a la vista (ionViewWillEnter)

## Deuda tecnica y mejoras planificadas (post-MVP)
- Optimizar filtros con RxJS switchMap para cancelar requests anteriores en tipeo rapido.
- Agregar distinctUntilChanged en filtros para evitar consultas repetidas con el mismo valor.
- Definir umbral minimo de busqueda (ej. 2 caracteres) antes de consultar backend.
- Mostrar estado de sin conexion y opcion de reintento en listado de negocios.
- **Integrar mapas (Google Maps o Mapbox)** en el formulario de negocio para:
  - Permitir al propietario seleccionar ubicación del negocio interactivamente
  - Visualizar ubicación en el mapa durante la creación/edición
  - Auto-completar latitud y longitud desde el marcador del mapa
  - Mostrar mapa en la página de detalle de negocio
- **Sistema dinámico de categorías** para el formulario de negocio:
  - Agregar opción "Otra categoría (especificar)" en el select de categorías
  - Cuando el usuario selecciona esta opción, mostrar campo texto libre para escribir su categoría personalizada
  - Enviar categoría personalizada al backend (POST /api/business/categories o similar)
  - Guardar nuevas categorías en el backend para que otros usuarios pueda verlas
  - Actualizar dropdown de categorías dinámicamente sin recargar la página
  - Mismo flujo en listado/búsqueda de negocios (filtro dinámico de categorías)
- **Campos dependientes en formulario de negocio (Departamento → Ciudad)**:
  - Reordenar campos del formulario: mover Departamento antes de Ciudad/Dirección
  - Implementar cascada de selección: cuando el usuario selecciona un Departamento, cargar dinámicamente solo las ciudades/pueblos/municipios de ese departamento
  - Obtener datos de División Política Administrativa (DIVIPOLA) de Colombia para mapeo Departamento → Municipios
  - Backend: crear endpoint GET /api/locations/municipalities?department={id} o traer datos embebidos en configuración inicial
  - Frontend: usar RxJS valueChanges en campo Departamento para disparar carga de municipios
  - UX: mostrar loading state en select de Ciudad mientras se cargan datos
  - Validación: asegurar que Ciudad siempre pertenezca al Departamento seleccionado
- **Mapa interactivo de negocios cercanos en HOME**:
  - Agregar sección "Disponibilidad cercana" en la página de inicio (entre accesos rápidos y recomendados)
  - Integrar Google Maps API o Mapbox para visualización interactiva
  - Obtener ubicación del usuario (Geolocation API con permiso solicitado)
  - Endpoint backend: GET /api/business/nearby?latitude={lat}&longitude={lng}&radius={km} para negocios cercanos
  - Mostrar pines en el mapa con:
    - Nombre del negocio al hover
    - Distancia en km
    - Categoría del servicio
    - Rating del negocio
  - Click en pin → abrir detalle del negocio o modal rápido con opción reservar
  - Implementar búsqueda de negocios por categoría en el mapa (filtros dinámicos)
  - Agregar botón para centrar mapa en ubicación actual del usuario
  - Mostrar ruta desde ubicación usuario hasta negocio seleccionado (Directions API)
  - Soportar modo oscuro/claro para los estilos del mapa
  - Manejo de permisos: solicitar permiso de ubicación al usuario la primera vez

