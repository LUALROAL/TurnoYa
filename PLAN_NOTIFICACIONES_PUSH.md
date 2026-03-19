# Plan de Arquitectura e Implementación: Notificaciones Push (FCM)
**Proyecto:** TurnoYa
**Objetivo:** Implementación de Notificaciones Push Nativas (Móviles y Web) utilizando Firebase Cloud Messaging (FCM) para alertar a dueños de negocios, empleados y clientes sobre actualizaciones en sus citas.

---

## 1. Contexto y Arquitectura 🏗️

Se requiere un sistema robusto, asíncrono y en tiempo real para mantener informados a los usuarios de la aplicación (tanto clientes como dueños de negocios) sin requerir que la aplicación esté abierta en primer plano.

**¿Por qué usamos Firebase (FCM)?**
El backend en `.NET` no tiene la capacidad técnica ni los permisos a nivel de sistema operativo para "despertar" un iPhone o un Android bloqueado. Tampoco puede mantener miles de conexiones abiertas (WebSockets directos) a los celulares de forma eficiente. 
*   **iOS** requiere estrictamente el uso de **APNs** (Apple Push Notification service).
*   **Android** requiere el uso de **FCM** (Google).
Firebase Cloud Messaging actúa como un "Proxy" o "Gateway" unificado. Nosotros (.NET) le hablamos a una única API (FCM), y Firebase se encarga del ruteo pesado hacia los sistemas operativos correspondientes.

### Diagrama de Flujo (El "Happy Path")
1.  La App de **Ionic** solicita permiso al Usuario (OS).
2.  El Celular se contacta con Firebase y obtiene un `Device Token` único.
3.  La App de **Ionic** envía mediante un POST HTTP ese token a la API de **.NET**.
4.  **.NET** guarda el Token en la Base de Datos asociado al `UserId`.
5.  Ocurre un evento (Ej. Un cliente reserva una cita).
6.  `AppointmentService` en **.NET** busca los tokens del Dueño involucrado.
7.  **.NET** invoca al SDK de Firebase y le entrega el mensaje y los tokens.
8.  Firebase despierta el dispositivo y muestra la notificación nativa.

---

## 2. Fases de Ejecución (Paso a Paso) 🚀

### FASE 1: Preparación de la Nube (Firebase)
*Toda esta fase es puramente configurativa y se realiza en el navegador.*
1.  **Crear Proyecto:** Ingresar a la Consola de Firebase y crear el proyecto "TurnoYa".
2.  **Activar Cloud Messaging:** Habilitar la API de mensajería (FCM).
3.  **Descargar Credenciales:** Generar la "Clave Privada" (un archivo `.json` de cuenta de servicio) desde la configuración del proyecto. Este archivo será vital para que el servidor .NET tenga permisos.
4.  **Configurar Apps Nativas:** Registrar una App "Android", "iOS" y "Web" en Firebase para obtener los `google-services.json` y configuraciones web necesarias para compilar Capacitor.

### FASE 2: Backend (.NET Core)
*Lógica pura de almacenamiento e inyección de eventos.*
1.  **Base de Datos (EF Core):**
    *   Crear una entidad `UserDeviceToken` `(Id, UserId, Token, DeviceOS, LastUsedAt)`.
    *   *Concepto:* Es una relación 1 a N. Un usuario puede tener sesión en su Celular Android y en un iPad. Queremos que la notificación llegue a ambos.
    *   Generar y aplicar la Migración en SQL Server.
2.  **SDK de Firebase:**
    *   Instalar vía NuGet el paquete `FirebaseAdmin`.
    *   Configurarlo en `Program.cs` para que inicialice la app usando el `.json` descargado en la Fase 1.
3.  **Endpoints (UserController):**
    *   Crear un `[HttpPost("devices/register")]` para recibir los tokens nuevos.
    *   Crear un `[HttpDelete("devices/unregister")]` para eliminar el token cuando el usuario cierre sesión (vital para no enviarle notificaciones de otro comercio a alguien que ya cerró sesión).
4.  **Servicio de Notificación (`IPushNotificationService`):**
    *   Crear un servicio encapsulado que tome un Título, un Cuerpo y un `UserId`.
5.  **Inyección en Dominio (`AppointmentService`):**
    *   Exactamente en el mismo lugar donde pusimos la alerta de Telegram, llamar al `IPushNotificationService.SendAsync(ownerId, "Nueva Cita", "Te han reservado...")`.

### FASE 3: Frontend (Ionic / Angular / Capacitor)
*Interacción con el usuario y captura de permisos de hardware.*
1.  **Plugins Nativos:**
    *   Instalar `@capacitor/push-notifications`.
2.  **Archivos de Configuración:**
    *   Colocar el `google-services.json` (Fase 1) en la carpeta de Android (`/android/app/`).
    *   (Futuro) Configurar los certificados de Apple en Xcode.
3.  **PushNotificationService (Angular):**
    *   Implementar una clase que al abrir la app (`app.component.ts`) verifique si hay permisos.
    *   Solicitar explícitamente permisos (`PushNotifications.requestPermissions()`).
    *   Registrar listeners (`PushNotifications.addListener('registration', ...)`).
4.  **Sincronización:**
    *   Cuando el listener entregue el famoso Token (Ej: `fcm_xyz123...`), llamar al API de .NET (`/devices/register`) y enviarlo silenciosamente en segundo plano.
5.  **Manejo de UI (Opcional):**
    *   Escuchar el evento `pushNotificationReceived` para mostrar un Toast o recargar la lista de citas si el usuario ya tiene la app abierta en primer plano (ya que el S.O. no muestra la tira de notificación si la app está en foco).

---

## 3. Requisitos Críticos y Bloqueantes ⚠️

*   **Para Android e Ionic Servido (PWA/Web):** Se puede implementar, probar y lanzar a producción de manera 100% gratuita usando únicamente tu cuenta de Google.
*   **Para iOS (Apple):** Es IMPOSIBLE implementar esto nativamente en un iPhone físico sin antes tener una membresía de pago activa del **Apple Developer Program** (~99 USD/año). Apple no te dejará emitir el certificado APNs necesario.
*   **Emuladores:** Las notificaciones Push NO se pueden probar de manera fiable en los emuladores básicos de iOS/Android ni en el navegador tirando un `ionic serve`. Requieren ser compiladas e instaladas en un dispositivo físico real, o usar emuladores muy específicos debidamente puenteados con Google Play Services y la red.
