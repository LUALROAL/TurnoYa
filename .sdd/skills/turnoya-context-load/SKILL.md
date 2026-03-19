# Cargar contexto de TurnoYa en memoria

## Descripción
Carga toda la documentación existente del proyecto en Engram para acceso persistente.

## Uso
/turnoya-context-load

## Instrucciones
1. Ir al proyecto:
   ```bash
   cd /c/Users/USUARIO/Desktop/TurnoYa
Cargar documentación general:

bash
/remember --file documentacion/ --recursive --key "turnoya-docs"
Cargar documentación de API:

bash
/remember --file documentacion_Api/ --recursive --key "turnoya-api-docs"
Verificar carga:

bash
/remember --list-keys
/remember --key "turnoya-docs" --summary
Output esperado

✅ Contexto turnoya-docs: 15 archivos cargados
✅ Contexto turnoya-api-docs: 8 archivos cargados
📊 Stack: .NET 8 + Ionic 8/Angular 20
🧠 Memoria persistente activa
   