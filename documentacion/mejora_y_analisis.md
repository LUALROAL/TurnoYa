Sistema de Citas – Refactorización Completa de Disponibilidad

Actúa como Arquitecto Senior Backend especializado en sistemas de scheduling escalables.

Necesito verifiques todo el flujo de la aplicacion para comenzar a ejecutar las mejoras que analices y rediseñes la lógica de disponibilidad y creación de citas de una aplicación.

Tu respuesta debe:

Pensar como arquitecto

Proponer solución limpia y escalable

Ejecutar tarea por tarea

No saltar pasos

Entregar código ejemplo cuando sea necesario

Validar edge cases

Optimizar rendimiento

📌 CONTEXTO DEL SISTEMA

Sistema de reservas con:

Negocio con horario laboral (ej: 7:00–18:00)

Descansos (ej: 12:00–13:00)

Empleados con horarios propios

Servicios con duración configurable

Buffer entre citas

Citas existentes que bloquean tiempo

🚨 PROBLEMA ACTUAL

Cuando el usuario selecciona un día disponible:

Solo aparecen 2 horas disponibles

Deberían aparecer muchas más

Ocurre especialmente cuando elige "sin preferencia de empleado y elige con con preferencia de empleado"

Problemas detectados:

Si employeeId es null:

Se usa horario del negocio

Se filtran citas solo por serviceId

NO se verifica disponibilidad real de empleados 

Al crear cita sin empleado:

Se guarda EmployeeId = null

Validación solo por servicio

Puede haber dobles reservas

Frontend solo muestra:

7:00


Debe mostrar:

7:00 - 8:00

🎯 OBJETIVO FINAL

El sistema debe:

✅ Disponibilidad sin empleado

Un slot es válido si:

Existe al menos un empleado:

Que trabaje ese horario

Que no tenga cita en ese horario

Que pueda atender el servicio

✅ Días disponibles

Un día es válido si:

Existe al menos un empleado con al menos un slot libre

✅ Creación de cita sin empleado

Se debe asignar automáticamente un empleado disponible

Validar conflicto por empleado

Nunca guardar EmployeeId null

✅ Frontend

Mostrar:

inicio - fin

🧩 EJECUTA LA SOLUCIÓN TAREA POR TAREA

No avances a la siguiente tarea sin completar la anterior.

🔷 TAREA 1 – Rediseño conceptual del modelo de disponibilidad

Explica:

Por qué el modelo actual es incorrecto

Qué principio arquitectónico se está violando

Cómo debe ser el modelo correcto

Define claramente:

Qué es un slot válido

Qué es un día válido

Qué es disponibilidad real

🔷 TAREA 2 – Nuevo algoritmo de generación de slots

Diseña algoritmo para:

Caso A – employeeId específico
Caso B – sin employeeId (multi-empleado)

Debe:

Considerar horarios individuales

Considerar descansos

Considerar duración

Considerar buffer

Considerar citas existentes

Evitar duplicados

Ser eficiente

Entrega:

Pseudocódigo claro

Versión C# ejemplo

Complejidad temporal estimada

🔷 TAREA 3 – Rediseño de validación de conflictos

Rediseña:

HasConflictAsync

Validación por empleado

Qué pasa con servicios distintos

Explica:

Por qué validar por serviceId es incorrecto

Cómo debe validarse correctamente

Entrega código C# limpio.

🔷 TAREA 4 – Asignación automática de empleado

Diseña método:

FindAvailableEmployeeAsync(...)


Debe:

Retornar el primer empleado libre

O aplicar estrategia inteligente (ej: menor carga)

Manejar concurrencia

Manejar edge cases

Incluye:

Estrategia recomendada

Código ejemplo

Cómo evitar race conditions

🔷 TAREA 5 – Refactorización completa de CreateAsync

Reescribe el flujo ideal:

Validar negocio

Validar servicio

Calcular endDate

Si no hay empleado → asignar automáticamente

Validar conflicto por empleado

Guardar cita

Incluye código ejemplo limpio.

🔷 TAREA 6 – Optimización y rendimiento

Analiza:

¿Qué pasa si hay 50 empleados?

¿Qué pasa si hay 500 citas por día?

¿Qué índices necesita la base de datos?

¿Conviene pre-calcular disponibilidad?

¿Conviene cachear?

Propón mejoras avanzadas.

🔷 TAREA 7 – Frontend (Angular)

Define:

Cómo mostrar rango horario

Cómo calcular hora fin

Cómo evitar recalcular innecesariamente

Cómo manejar cambio de servicio dinámicamente

Incluye código TypeScript ejemplo.

🔷 TAREA 8 – Edge Cases Críticos

Analiza y resuelve:

Dos usuarios reservando el mismo slot al mismo tiempo

Cambio de duración de servicio

Cancelación de cita

Empleado desactivado

Horarios cambiados

Cambio de buffer

📌 REGLAS IMPORTANTES

No des una respuesta superficial.

No simplifiques el problema.

Diseña como si fuera un SaaS real.

Piensa en escalabilidad.

Piensa en concurrencia.

Piensa en consistencia.

🎯 RESULTADO ESPERADO

Un rediseño completo, profesional y robusto del sistema de disponibilidad