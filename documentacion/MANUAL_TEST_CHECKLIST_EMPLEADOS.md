# Manual Testing Checklist - Gestión de Empleados con Permisos

## Pre-requisitos
- API corriendo en `https://localhost:5001`
- Frontend corriendo
- Usuario owner con al menos un negocio
- Al menos un empleado creado en el negocio

---

## Escenario 1: Owner genera enlace de invitación

### Pasos
1. Iniciar sesión como BusinessOwner
2. Ir a gestión de empleados
3. Seleccionar un empleado existente o crear uno nuevo
4. Hacer clic en "Invitar empleado"
5. Copiar el enlace generado

### Resultados esperados
- Se genera un token único
- El enlace incluye el token como parámetro
- El token tiene fecha de expiración (7 días)
- El empleado queda marcado como "pendiente de invitación" en el sistema

### Verificación en base de datos
```sql
SELECT Id, Name, InvitationToken, InvitationTokenExpiry, IsInvitationUsed 
FROM Employees 
WHERE Id = '<empleado-id>';
```

---

## Escenario 2: Empleado acepta invitación (nuevo usuario)

### Pasos
1. Abrir el enlace de invitación en navegador incógnito
2. Sistema detecta que no hay sesión activa
3. Usuario completa registro (nombre, email, contraseña)
4. Confirmar registro

### Resultados esperados
- Se crea nuevo usuario en tabla Users
- Se vincula el usuario con el negocio como Employee
- El token se marca como utilizado (IsInvitationUsed = true)
- Usuario es redirigido al dashboard de empleado

### Verificación en base de datos
```sql
-- Ver usuario creado
SELECT * FROM Users WHERE Email = '<email-ingresado>';

-- Ver empleado vinculado
SELECT e.*, u.Email as UserEmail 
FROM Employees e 
JOIN Users u ON e.UserId = u.Id 
WHERE e.InvitationToken IS NULL AND e.IsInvitationUsed = 1;
```

---

## Escenario 3: Empleado acepta invitación (usuario existente)

### Pasos
1. Cerrar sesión actual
2. Abrir el enlace de invitación
3. Sistema detecta sesión activa
4. Usuario ya tiene cuenta en TurnoYa
5. Confirmar aceptación de invitación

### Resultados esperados
- Se vincula el usuario existente con el negocio como Employee
- El token se marca como utilizado
- Usuario puede acceder al dashboard de empleado

### Verificación en base de datos
```sql
SELECT e.*, u.Email 
FROM Employees e 
JOIN Users u ON e.UserId = u.Id 
WHERE e.BusinessId = '<negocio-id>' AND u.Id = '<usuario-existente-id>';
```

---

## Escenario 4: Owner asigna permisos a empleado

### Pasos
1. Iniciar sesión como BusinessOwner
2. Ir a gestión de empleados
3. Seleccionar un empleado
4. Hacer clic en "Permisos"
5. Habilitar/Deshabilitar permisos específicos
6. Guardar

### Resultados esperados
- Permisos se guardan en tabla EmployeePermissions
- Los cambios se reflejan inmediatamente

### Permisos disponibles
| Permiso | Descripción |
|---------|-------------|
| CanViewAppointments | Ver citas asignadas |
| CanAcceptAppointments | Aceptar citas |
| CanRejectAppointments | Rechazar citas |
| CanCancelAppointments | Cancelar citas |
| CanRescheduleAppointments | Reprogramar citas |
| CanManageSchedule | Gestionar horario |
| CanViewServices | Ver servicios |
| CanManageServices | Gestionar servicios |

### Verificación en base de datos
```sql
SELECT * FROM EmployeePermissions WHERE EmployeeId = '<empleado-id>';
```

---

## Escenario 5: Empleado ve sus citas

### Pasos
1. Iniciar sesión como empleado
2. Ir a dashboard de empleado
3. Ver listado de citas

### Resultados esperados
- Solo ve citas asignadas a él
- No ve citas de otros empleados
- Muestra información: cliente, servicio, fecha/hora, estado

---

## Escenario 6: Empleado con permiso de aceptar/rechazar citas

### Pasos
1. Owner asignó permisos CanAcceptAppointments y CanRejectAppointments
2. Hay una cita pendiente asignada al empleado
3. Empleado ve la cita en su dashboard
4. Empleado hace clic en "Aceptar" o "Rechazar"

### Resultados esperados
- Cita cambia de estado a "Confirmada" (si acepta) o "Rechazada" (si rechaza)
- Cliente recibe notificación del cambio
- Historial de la cita se actualiza

### Verificación en base de datos
```sql
SELECT * FROM Appointments WHERE Id = '<cita-id>';
```

---

## Escenario 7: Empleado con permisos mínimos (solo vista)

### Pasos
1. Owner solo dio permiso CanViewAppointments
2. Empleado intenta hacer clic en aceptar/rechazar

### Resultados esperados
- Botones de acción NO aparecen
- Si intenta mediante API directa, recibe error 403

### Verificación en base de datos
```sql
SELECT CanAcceptAppointments, CanRejectAppointments 
FROM EmployeePermissions 
WHERE EmployeeId = '<empleado-id>';
```

---

## Escenario 8: Invitación expirada

### Pasos
1. Owner genera invitación
2. Se modifica la fecha de expiración en BD a fecha pasada
3. Empleado intenta usar el enlace

### Resultados esperados
- Error: "El enlace de invitación ha expirado. Solicitá uno nuevo a tu empleador."
- No se vincula al usuario con el negocio

---

## Notas
- Todos los escenarios deben probarse tanto en API como en Frontend
- Verificar que los errores de permisos sean claros para el usuario
- Verificar notificaciones en tiempo real vía SignalR
