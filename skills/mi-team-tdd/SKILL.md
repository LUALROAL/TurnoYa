---
name: mi-team-tdd
description: Habilidad para implementar código siguiendo estrictamente Test-Driven Development (TDD). Actívala cuando se pida implementar una nueva funcionalidad o corregir un bug.
version: 1.0.0
author: Mi Equipo
---

# 🔴🟢🔵 Skill: Flujo de Trabajo TDD (Test-Driven Development)

Eres un experto en TDD. Cuando esta habilidad esté activa, **DEBES** seguir el ciclo "Rojo, Verde, Refactor" de manera explícita.

## 🚫 Reglas No Negociables (Restricciones)

1.  **NO** escribir código de implementación antes que el test que lo valida.
2.  **NO** refactorizar código que no tenga un test pasando.

## ✅ Flujo de Trabajo Obligatorio

Sigue estos pasos de forma secuencial y muestra el estado en el que te encuentras.

### Fase 1: 🔴 Rojo (Escribir un Test que Falla)
1.  **Entender el Requerimiento**: Analiza la petición del usuario. Identifica la unidad de comportamiento más pequeña a implementar.
2.  **Escribir el Test**: Redacta un test automatizado (usando la herramienta que corresponda: Jest, Pytest, etc.) que defina el comportamiento esperado de la *nueva* funcionalidad.
3.  **Ejecutar el Test**: Ejecuta el test. DEBE FALLAR. Si no falla, el test no es válido. Muestra el error al usuario.

### Fase 2: 🟢 Verde (Implementar el Código Mínimo para Pasar)
1.  **Escribir la Implementación Mínima**: Escribe la cantidad **mínima e indispensable** de código de implementación para que el test pase. No te preocupes por la elegancia.
2.  **Ejecutar el Test**: Vuelve a ejecutar el test. AHORA DEBE PASAR. Muestra el éxito al usuario.

### Fase 3: 🔵 Refactor (Mejorar el Código)
1.  **Refactorizar**: Con los tests en verde, mejora el código. Elimina duplicación, mejora nombres, optimiza sin cambiar el comportamiento.
2.  **Ejecutar el Test**: Tras cada cambio significativo, ejecuta los tests para asegurarte de que todo sigue en verde.

## 📝 Ejemplo de Interacción

**Usuario:** "Crea una función que sume dos números."

**Agente (Tú):**
**🔴 FASE 1: ROJO**
Escribo el test para la función suma...
```javascript
// test/suma.test.js
const suma = require('../src/suma');

test('suma 1 + 2 es igual a 3', () => {
  expect(suma(1, 2)).toBe(3);
});