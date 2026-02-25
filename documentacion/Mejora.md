🚀 Nueva Funcionalidad: Configuración de Horarios de Atención del Negocio

Quiero implementar una nueva funcionalidad en el sistema que permita a cada negocio configurar su disponibilidad horaria, sin afectar la lógica actual del sistema.

Actúa como:

Desarrollador Full Stack Senior

Especialista en Ionic + Angular + Tailwind

Desarrollador Senior en .NET (ASP.NET Core / Entity Framework)

Especialista en SQL Server

Analista profesional de software (arquitectura, buenas prácticas, seguridad y escalabilidad)

🎯 Objetivo

Actualmente el usuario puede crear un negocio, pero no puede configurar su horario de atención.

Necesitamos que el dueño del negocio pueda:

Configurar sus días laborales (ej: lunes a viernes).

Definir horarios disponibles por día.

Configurar:

Disponibilidad semanal

Disponibilidad mensual

Disponibilidad por días específicos

Definir bloques de atención, por ejemplo:

Lunes, miércoles y viernes

De 1:00 p.m. a 5:00 p.m.

O de 6:00 a.m. a 5:00 p.m.

Definir intervalos de descanso (ej: 1 hora de almuerzo).

Definir duración de citas (ej: 30 min, 45 min, 1 hora).

El resultado final debe permitir que:

👉 El usuario final (cliente) vea únicamente los horarios realmente disponibles y pueda agendar citas en esos espacios.

🧠 PRIMERA FASE: ANÁLISIS (OBLIGATORIO)

Antes de desarrollar:

Analiza completamente:

Estructura de carpetas frontend (Ionic/Angular).

Módulo de negocios.

Flujo actual de creación/edición.

Manejo de citas (si ya existe).

Servicios HTTP existentes.

Guards y seguridad.

DTOs actuales.

Entidades y relaciones.

Configuración de EF Core.

Migraciones existentes.

Verifica si ya existe:

Algún endpoint relacionado con disponibilidad.

Alguna tabla relacionada con horarios.

Alguna lógica de citas reutilizable.

⚠️ No romper nada existente.
⚠️ No modificar comportamiento actual.
⚠️ Solo extender el sistema correctamente.

🏗 SEGUNDA FASE: DISEÑO DE SOLUCIÓN

Si no existe la estructura necesaria, diseñar:

📦 Backend (.NET + SQL Server)
1️⃣ Modelo de Datos Propuesto (Ejemplo lógico)

BusinessSchedule

BusinessWorkingDay

BusinessTimeBlock

BusinessBreakTime

AppointmentSlot (si aplica generación dinámica)

Evaluar si:

Es mejor generar slots dinámicamente.

O almacenarlos pre-generados.

O usar estrategia híbrida.

Diseñar pensando en:

Escalabilidad.

Evitar sobrecarga de base de datos.

Buen rendimiento.

Normalización adecuada.

2️⃣ Migraciones

Si es necesario:

Crear nuevas tablas.

Configurar relaciones con Business.

Crear migración EF Core.

Validar constraints e índices.

3️⃣ Endpoints

Crear endpoints REST bien estructurados:

Ejemplo:

GET /api/business/{id}/schedule

POST /api/business/{id}/schedule

PUT /api/business/{id}/schedule

GET /api/business/{id}/available-slots?date=2026-03-01

Aplicar:

Validaciones.

Autorización (solo dueño del negocio puede modificar).

Protección contra sobreescritura.

Buen manejo de errores.

Respuestas estandarizadas.

🎨 TERCERA FASE: FRONTEND (Ionic + Angular + Tailwind)

Diseñar una interfaz profesional donde el dueño del negocio pueda:

1️⃣ Configurar días laborales

Checkbox por día:

Lunes

Martes

Miércoles

etc.

2️⃣ Definir horario por día

Hora inicio

Hora fin

Intervalo de descanso

Duración de cita

3️⃣ Vista clara y profesional

Diseño limpio con Tailwind.

Responsivo.

UX amigable.

Validaciones en tiempo real.

Evitar conflictos de horarios.

🔐 SEGURIDAD

Implementar:

Validación backend obligatoria.

No confiar en el frontend.

Validar que el negocio pertenezca al usuario autenticado.

Validar que no existan bloques superpuestos.

Manejo correcto de fechas y zonas horarias.

🧩 CUARTA FASE: LÓGICA DE DISPONIBILIDAD

El usuario final debe:

Seleccionar fecha.

Ver únicamente los slots disponibles.

No ver horarios ocupados.

No poder reservar fuera del horario configurado.

No poder reservar en horarios de descanso.

📌 REQUISITOS IMPORTANTES

No romper funcionalidad actual.

No duplicar lógica innecesaria.

Seguir patrón de arquitectura existente.

Mantener coherencia con naming conventions actuales.

Aplicar buenas prácticas SOLID.

Código limpio y mantenible.

Separación clara de responsabilidades.

🎯 RESULTADO ESPERADO

Un sistema donde:

El dueño configura su disponibilidad.

El sistema calcula correctamente los espacios disponibles.

El cliente solo puede agendar en horarios válidos.

Todo funciona integrado sin afectar el flujo actual.