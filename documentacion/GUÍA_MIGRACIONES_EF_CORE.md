# Guía Técnica: Cómo Realizar una Migración en Entity Framework Core (EF Core)

Esta guía explica paso a paso cómo crear, aplicar y gestionar migraciones en un proyecto .NET usando Entity Framework Core. Está orientada a desarrolladores que trabajan con bases de datos relacionales y desean mantener el esquema sincronizado con el modelo de entidades del código.

---

## 1. ¿Qué es una migración en EF Core?
Una migración es un conjunto de instrucciones que permite actualizar la estructura de la base de datos (tablas, columnas, relaciones, etc.) para reflejar los cambios realizados en el modelo de entidades del proyecto.

---

## 2. Requisitos previos
- Tener instalado el SDK de .NET y el paquete de herramientas de EF Core.
- Un proyecto .NET configurado con Entity Framework Core.
- Conexión a la base de datos configurada en `appsettings.json`.

---

## 3. Flujo típico de trabajo

### a) Modifica el modelo de datos
Realiza los cambios necesarios en tus clases de entidad (por ejemplo, agrega una propiedad, crea una nueva entidad, etc.).

### b) Compila el proyecto
Antes de crear la migración, asegúrate de que el proyecto compila correctamente:
```bash
dotnet build <ruta-al-csproj>
```

### c) Crea la migración
Ejecuta el siguiente comando desde la raíz del proyecto o donde esté el archivo `.csproj`:
```bash
dotnet ef migrations add <NombreDeLaMigracion> --project <ruta-al-proyecto-infraestructura> --startup-project <ruta-al-proyecto-api>
```
- `<NombreDeLaMigracion>`: Un nombre descriptivo (ej: `AddBusinessScheduleModel`).
- `--project`: Proyecto donde están las migraciones y el DbContext.
- `--startup-project`: Proyecto que contiene la configuración de inicio (API).

### d) Revisa los archivos generados
Se crearán archivos en la carpeta `Migrations/` del proyecto de infraestructura. Revisa que reflejen los cambios esperados.

### e) Aplica la migración a la base de datos
Ejecuta:
```bash
dotnet ef database update --project <ruta-al-proyecto-infraestructura> --startup-project <ruta-al-proyecto-api>
```
Esto actualizará la base de datos con la nueva estructura.

---

## 4. Comandos útiles
- **Eliminar la última migración (si aún no fue aplicada):**
  ```bash
  dotnet ef migrations remove --project <ruta-al-proyecto-infraestructura> --startup-project <ruta-al-proyecto-api>
  ```
- **Ver el historial de migraciones aplicadas:**
  ```bash
  dotnet ef migrations list --project <ruta-al-proyecto-infraestructura> --startup-project <ruta-al-proyecto-api>
  ```

---

## 5. Buenas prácticas
- Siempre compila antes de crear una migración.
- Usa nombres descriptivos para las migraciones.
- Revisa el código generado antes de aplicar la migración.
- Haz backup de la base de datos antes de aplicar migraciones en producción.
- Versiona los archivos de migración en tu sistema de control de versiones (ej: git).

---

## 6. Ejemplo completo
Supón que agregas una entidad `BusinessSchedule`:
1. Modifica el modelo en C#.
2. Compila: `dotnet build TurnoYaAPI/TurnoYa.API/TurnoYa.API.csproj`
3. Crea la migración:
   ```bash
   dotnet ef migrations add AddBusinessScheduleModel --project TurnoYaAPI/TurnoYa.Infrastructure/TurnoYa.Infrastructure.csproj --startup-project TurnoYaAPI/TurnoYa.API/TurnoYa.API.csproj
   ```
4. Aplica la migración:
   ```bash
   dotnet ef database update --project TurnoYaAPI/TurnoYa.Infrastructure/TurnoYa.Infrastructure.csproj --startup-project TurnoYaAPI/TurnoYa.API/TurnoYa.API.csproj
   ```

---

## 7. Solución de problemas comunes
- **Error de compilación:** Corrige los errores y vuelve a compilar antes de crear la migración.
- **Migración no refleja los cambios:** Verifica que guardaste todos los archivos y que el DbContext está actualizado.
- **Conflictos de migraciones:** Si varios desarrolladores crean migraciones en paralelo, resuelve los conflictos manualmente y aplica las migraciones en orden.

---

## 8. Recursos adicionales
- [Documentación oficial de EF Core](https://learn.microsoft.com/es-es/ef/core/)
- [Comandos de la CLI de EF Core](https://learn.microsoft.com/es-es/ef/core/cli/dotnet)

---

**Autor:** GitHub Copilot — Última actualización: 24/02/2026
