
---

## 📚 **SKILL 4: `turnoya-feature-new.md` - Nueva feature con SDD**

```markdown
# Iniciar nueva feature en TurnoYa con flujo SDD completo

## Descripción
Crea una nueva feature siguiendo las 9 fases del SDD, con soporte para Clean Architecture.

## Uso
/turnoya-feature-new [nombre-feature]

## Ejemplos
```bash
/turnoya-feature-new "feature/turnos-recurrentes"
/turnoya-feature-new "feature/notificaciones-push"
/turnoya-feature-new "feature/pagos-online"
/turnoya-feature-new "feature/google-calendar-sync"
Instrucciones
Asegurar contexto cargado:

bash
/remember --key "turnoya-docs"
Iniciar nueva feature:

bash
/sdd-new "feature/turnos-recurrentes"
Durante el proceso, el flujo SDD:

Fase 1-2: Propuesta (sdd-propose)
Nombre de la feature

Descripción de alto nivel

Objetivos de negocio

Criterios de éxito

Fase 3: Especificación (sdd-spec)
Requerimientos funcionales detallados

Requerimientos no funcionales

Criterios de aceptación

Mockups/UX (si aplica)

Fase 4: Diseño Técnico (sdd-design)
Para Clean Architecture:

markdown
## Backend (.NET 8)
- **Core**: Entidades, interfaces
- **Application**: Casos de uso, DTOs
- **Infrastructure**: Repositorios, servicios externos
- **API**: Endpoints, controllers

## Frontend (Ionic/Angular)
- **Pages**: Nuevas vistas
- **Components**: Componentes reutilizables
- **Services**: Comunicación con API
- **Models**: Interfaces TypeScript
- **State**: Gestión de estado
Fase 5: Tareas (sdd-tasks)
Checklist por capa:

markdown
Backend:
[ ] Core: Entidad RecurringTurno
[ ] Application: CreateRecurringTurnoCommand
[ ] Infrastructure: RecurringTurnoRepository
[ ] API: RecurringTurnoController

Frontend:
[ ] Models: recurring-turno.types.ts
[ ] Service: recurring-turno.service.ts
[ ] Page: recurring-turno.page.ts
[ ] Component: recurring-form.component.ts
[ ] Tests: *.spec.ts
Fase 6: Implementación (sdd-apply)
Ejecutar tarea por tarea

Commits por cada tarea completada

Fase 7: Verificación (sdd-verify)
Tests unitarios

Tests de integración

Validación de criterios de aceptación

Fase 8: Documentación
Actualizar documentacion/

Actualizar documentacion_Api/

Fase 9: Archive (sdd-archive)
Cerrar feature

Guardar en memoria

Output esperado

✅ Feature [nombre] iniciada
📁 .sdd/feature/[nombre]/ creada
📋 Fases 1-4 completadas
📝 Checklist de tareas generado