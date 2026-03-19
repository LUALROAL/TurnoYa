
---

## 📚 **SKILL 6: `turnoya-docs-update.md` - Actualizar documentación**

```markdown

# Actualizar documentación de TurnoYa

## Descripción
Guía para mantener actualizada la documentación del proyecto.

## Uso
/turnoya-docs-update [feature]

## Instrucciones
1. Después de completar una feature:
   ```bash
   /turnoya-docs-update "feature/turnos-recurrentes"
Actualizar documentación general:

bash
# Agregar a documentacion/
echo "# Turnos Recurrentes" >> documentacion/features/turnos-recurrentes.md
# Agregar detalles de implementación
Actualizar documentación de API:

bash
# Documentar nuevos endpoints
cat > documentacion_Api/turnos-recurrentes.md << EOF
# API de Turnos Recurrentes

## POST /api/turnos/recurrentes
Crea una serie de turnos recurrentes

## GET /api/turnos/recurrentes/{id}
Obtiene detalles de una recurrencia
EOF
Guardar en memoria:

bash
/remember --file documentacion/ --recursive --key "turnoya-docs" --update
Output esperado

📝 Documentación actualizada
✅ Features: +1
✅ API docs: +3 endpoints
🧠 Memoria sincronizada