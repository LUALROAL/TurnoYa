# E2E Manual Test Procedure: Notificaciones en Tiempo Real con SignalR

## Objetivo

Verificar el flujo completo de notificaciones en tiempo real:
1. Un cliente crea una cita desde la app móvil (web app).
2. El dueño del negocio recibe la notificación SignalR **sin hacer refresh**.
3. El dueño confirma la cita.
4. El cliente recibe la notificación de confirmación en tiempo real.

> **Nota**: Este test requiere ngrok para exponer el backend local a internet,
> permitiendo que el dispositivo móvil (app Ionic/Capacitor) se conecte al hub SignalR.

---

## Requisitos Previos

- [ ] Backend API corriendo en `http://localhost:5000` o `https://localhost:5001`
- [ ] ngrok instalado y configurado (`ngrok config add-authtoken <token>`)
- [ ] App móvil Ionic/Capacitor corriendo en emulador o dispositivo físico
- [ ] Credenciales de test: un usuario cliente y un usuario dueño de negocio
- [ ] Postman o similar para verificar el endpoint del Hub

---

## Escenario 1: WebSocket Connection & JWT Auth

### Paso 1 — Iniciar ngrok

```bash
# Terminal 1
ngrok http 5001 --host-header=localhost:5001
```

Copia la URL HTTPS generada (ej: `https://abc123.ngrok-free.app`).

### Paso 2 — Generar JWT para el cliente

```bash
# Con Postman o curl
POST https://localhost:5001/api/auth/login
Body: { "email": "cliente@test.com", "password": "test123" }

# Response:
# { "token": "eyJhbGciOiJIUzI1NiIs...", "user": {...} }
```

Copia el `token` JWT.

### Paso 3 — Verificar handshake WebSocket con SignalR

```bash
# Con Postman WebSocket (o herramienta como Husk):
# URL: wss://abc123.ngrok-free.app/hubs/notifications?access_token=<JWT_TOKEN>

# Expected:
# ✓ WebSocket connection established (101 Switching Protocols)
# ✓ JWT validated server-side
# ✓ Client joined group "user:{userId}"
```

**Verificación en consola del backend**:
```
Client connected: {connectionId} joined group user:abc-123
```

---

## Escenario 2: Real-Time Notification — Appointment Created

### Precondición
- Cliente conectado al hub SignalR (Escenario 1 completado).
- Dueño del negocio conectado al hub SignalR (repite pasos 2-3 con JWT de owner).

### Paso 4 — Crear cita desde la app web (usando Postman como cliente API)

```bash
# Simular creación de cita (como lo haría la app web)
POST https://localhost:5001/api/appointments
Authorization: Bearer <OWNER_TOKEN>
Body: {
  "businessId": "<BUSINESS_ID>",
  "serviceId": "<SERVICE_ID>",
  "scheduledDate": "2026-03-25T14:00:00Z"
}
```

### Paso 5 — Verificar notificación en tiempo real

**En la app móvil del dueño** (conectado via SignalR):
```
📱 Console/UI:
[SignalR] Received: AppointmentCreated
  - BusinessId: <BUSINESS_ID>
  - ServiceName: Corte de pelo
  - CustomerId: <CUSTOMER_ID>
  - ScheduledDate: 2026-03-25T14:00:00Z
```

**Tiempo esperado**: < 500ms desde que se confirma la creación en la DB.

---

## Escenario 3: Real-Time Notification — Appointment Confirmed

### Paso 6 — Dueño confirma la cita

```bash
# Via Postman o dashboard web
POST https://localhost:5001/api/appointments/<APPOINTMENT_ID>/confirm
Authorization: Bearer <OWNER_TOKEN>
```

### Paso 7 — Verificar notificación en la app móvil del cliente

**En la app móvil del cliente** (conectado via SignalR):
```
📱 Console/UI:
[SignalR] Received: AppointmentConfirmed
  - AppointmentId: <APPOINTMENT_ID>
  - Status: Confirmed
  - BusinessName: Barbería Central
```

---

## Escenario 4: Real-Time Notification — Appointment Cancelled

### Paso 8 — Cliente cancela la cita

```bash
POST https://localhost:5001/api/appointments/<APPOINTMENT_ID>/cancel
Authorization: Bearer <CUSTOMER_TOKEN>
Body: { "reason": "Cambio de planes" }
```

### Paso 9 — Verificar que ambos reciben la cancelación

**En la app del cliente**:
```
[SignalR] Received: AppointmentCancelled
  - Reason: Cambio de planes
```

**En la app del dueño**:
```
[SignalR] Received: AppointmentCancelled
  - Reason: Cambio de planes
```

---

## Escenario 5: Auto-Reconnection After Network Loss

### Paso 10 — Simular desconexión

En la app móvil, activa el modo avión por 10 segundos.

### Paso 11 — Verificar auto-reconexión

```
[SignalR] Connection lost. Reconnecting in 2s (attempt 1/5)...
[SignalR] Reconnecting in 4s (attempt 2/5)...
[SignalR] Reconnected! Re-joined groups.
```

**Verificar en backend**:
```
Client disconnected: {connectionId}
Client connected: {newConnectionId} joined group user:{userId}
```

### Paso 12 — Crear otra cita (verificar que recibe mientras estaba desconectado)

> ⚠️ **Nota**: SignalR solo entrega mensajes mientras está conectado.
> Mensajes enviados mientras estaba desconectado se pierden (no hay persisted connection).
> Esto es correcto — FCM es el fallback para mensajes perdidos.

---

## Escenario 6: Capacitor Lifecycle — Background/Foreground

### Paso 13 — Background la app

En el dispositivo, minimizar la app (ir a otra app).

### Paso 14 — Crear cita mientras la app está en background

```bash
POST https://localhost:5001/api/appointments
Authorization: Bearer <OWNER_TOKEN>
# ... crear cita ...
```

### Paso 15 — Verificar que NO recibe SignalR (app en background)

```
[SignalR] Connection state: Disconnected (expected — app in background)
```

### Paso 16 — Traer la app al foreground

Verificar en logs que:
```
[SignalR] onAppEnter — reconnecting...
[SignalR] Reconnected! Re-joined groups.
```

---

## Checklist de Verificación

| # | Escenario | Verificación | Estado |
|---|-----------|--------------|--------|
| 1 | WebSocket handshake con JWT | Connection established, group joined | ☐ |
| 2 | AppointmentCreated → negocio | Notificación < 500ms en app dueño | ☐ |
| 3 | AppointmentConfirmed → cliente | Notificación en app cliente | ☐ |
| 4 | AppointmentCancelled → ambos | Ambos reciben evento con reason | ☐ |
| 5 | Auto-reconexión (5 intentos) | Exponential backoff: 2,4,8,16,32s | ☐ |
| 6 | App lifecycle: background | Se desconecta correctamente | ☐ |
| 7 | App lifecycle: foreground | Se reconecta y rejoin groups | ☐ |

---

## Troubleshooting

### "Connection rejected with 401"

**Causa**: JWT expirado o malformado.
**Solución**: Verificar que el token se pasa correctamente en `?access_token=` query string.
```typescript
// En signalr.service.ts
const connection = new HubConnectionBuilder()
  .withUrl(`${environment.signalRHubUrl}?access_token=${token}`)
  .build();
```

### "No userId/businessId claims found"

**Causa**: El JWT no contiene los claims esperados.
**Solución**: Verificar que el JWT incluye `ClaimTypes.NameIdentifier` para clientes
o `business_id` para dueños.

### "WebSocket connection failed"

**Causa**: ngrok no está corriendo o la URL cambió.
**Solución**: 
```bash
# Verificar que ngrok está activo
ngrok http 5001

# Verificar en dashboard: https://dashboard.ngrok.com
```

### "CORS policy blocked origin"

**Causa**: El origen de la request no está en la lista de CORS permitidos.
**Solución**: Verificar `Program.cs`:
```csharp
policy.WithOrigins(
    "capacitor://localhost",
    "http://localhost:8100"
)
.AllowCredentials()
.SetIsOriginAllowed(origin => true);
```

### "AppointmentCreated received but UI not updating"

**Causa**: SignalR recibe el evento pero el Subject no está subscrito.
**Solución**: Verificar en `app.component.ts` que los eventos se conectan al estado:
```typescript
this.signalRService.appointmentCreated$.subscribe(event => {
  // Update local state or trigger UI refresh
});
```

---

## Métricas de Éxito

| Métrica | Target | Método de medición |
|---------|--------|-------------------|
| Tiempo de entrega SignalR | < 500ms | Console timestamp desde API response hasta SignalR event |
| Tasa de reconexión exitosa | 100% (transient) | 5 intentos con exponential backoff |
| Latencia de handshake WS | < 2s | Timestamp handshake start → OnConnectedAsync |
