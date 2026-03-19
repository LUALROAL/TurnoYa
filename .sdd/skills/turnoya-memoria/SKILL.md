
---

## 📚 **SKILL 7: `turnoya-memoria.md` - Gestión de memoria Engram**

```markdown
# Gestión de memoria para TurnoYa

## Descripción
Comandos para guardar y recuperar contexto del proyecto.

## Uso
/turnoya-memoria [comando]

## Comandos disponibles

### Guardar progreso de sesión
```bash
/turnoya-memoria save "Completada feature X, pendiente Y"
# o
/remember "TurnoYa: Avance: implementado CreateTurnoCommand" --key "turnoya-progress"
Recuperar contexto al iniciar
bash
/turnoya-memoria load
# o
/remember --key "turnoya-docs"
/remember --key "turnoya-api-docs"
/remember --key "turnoya-progress"
Listar todo lo guardado
bash
/turnoya-memoria list
# o
/remember --list-keys
Buscar en memoria
bash
/turnoya-memoria search "autenticación"
# o
/remember --search "JWT" --key "turnoya-docs"
Limpiar memoria de sesión
bash
/turnoya-memoria clear-session
Output esperado

🧠 Memoria de TurnoYa
📌 Keys activas:
  - turnoya-docs (15 archivos)
  - turnoya-api-docs (8 archivos)
  - turnoya-progress (última sesión)
  - sdd-init/TurnoYa (contexto inicial)
