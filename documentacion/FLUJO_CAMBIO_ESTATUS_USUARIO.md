# Flujo de cambio de estatus de usuario (Cliente / Dueño de negocio)

## Objetivo
Permitir que el estatus del usuario cambie automáticamente entre "Cliente" y "Dueño de negocio" según si tiene negocios creados o no, y mostrar el estatus en español en la interfaz.

---

## Tareas

### 1. Actualizar backend para cambiar rol a OwnerBusiness al crear el primer negocio
- Al crear un negocio (endpoint POST /api/business), si el usuario tiene rol "Customer", cambiarlo a "OwnerBusiness".
- Guardar el nuevo rol en la base de datos.
- Validar que el cambio solo ocurra si es el primer negocio.

### 2. Actualizar backend para cambiar rol a Customer si el usuario elimina todos sus negocios
- Al eliminar un negocio (endpoint DELETE /api/business/{id}), verificar si el usuario no tiene más negocios.
- Si no tiene negocios, cambiar el rol a "Customer".
- Guardar el nuevo rol en la base de datos.

### 3. Exponer el rol del usuario en UserProfileDto y API
- Asegurarse que el campo "role" esté presente en UserProfileDto.
- El endpoint GET /api/users/me debe devolver el rol actualizado.

### 4. Actualizar frontend para mostrar el estatus en español
- En la página de perfil, mostrar el estatus del usuario en español:
  - "Cliente" si el rol es "Customer"
  - "Dueño de negocio" si el rol es "OwnerBusiness"
- Actualizar el diseño si es necesario.

### 5. Actualizar frontend para reaccionar a creación/eliminación de negocios
- Cuando el usuario crea su primer negocio, actualizar el estatus mostrado a "Dueño de negocio".
- Cuando elimina el último negocio, actualizar el estatus mostrado a "Cliente".
- Validar que el cambio sea inmediato y sin recargar la página.

---

## Flujo resumido
1. Usuario se registra → estatus "Cliente".
2. Usuario crea su primer negocio → backend cambia rol a "OwnerBusiness" → frontend muestra "Dueño de negocio".
3. Usuario elimina todos sus negocios → backend cambia rol a "Customer" → frontend muestra "Cliente".

---

## Notas
- El cambio de rol debe ser automático y transparente para el usuario.
- El estatus debe mostrarse siempre en español en la interfaz.
- El frontend debe reaccionar dinámicamente a los cambios.

---

Indica qué tarea quieres que desarrolle primero.