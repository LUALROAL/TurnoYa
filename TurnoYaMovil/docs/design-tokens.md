# Design Tokens - TurnoYa

Documentación del sistema de diseño visual de TurnoYa. Este archivo sirve como referencia única para todos los tokens CSS utilizados en la aplicación.

## Naming Convention

Los tokens siguen el prefijo `--ion-color-*` para mantener compatibilidad nativa con Ionic y evitar conflictos con otras librerías.

### Estructura de Nombres

```
--ion-color-[categoría]-[variante]
```

- **categoría**: bg, neon, text, border, primary, secondary, etc.
- **variante**: primary, secondary, dark, light, hover, shade, tint

### Prefijos por Categoría

| Prefijo | Uso |
|---------|-----|
| `--ion-color-bg-*` | Colores de fondo |
| `--ion-color-neon-*` | Efectos de brillo/neón |
| `--ion-color-text-*` | Colores de texto |
| `--ion-color-border-*` | Colores de borde |
| `--ion-color-*` (standard Ionic) | Colores semánticos (primary, secondary, success, warning, danger, dark, medium, light) |
| `--ion-font-*` | Tokens de tipografía |
| `--ion-spacing-*` | Tokens de espaciado |
| `--ion-border-radius-*` | Tokens de radio de borde |
| `--ion-box-shadow-*` | Tokens de sombra |
| `--ion-backdrop-blur-*` | Tokens de desenfoque |
| `--ion-breakpoint-*` | Puntos de rotura responsivos |
| `--ion-gradient-*` | Gradientes predefinidos |
| `--ion-transition-*` | Duraciones de transición |
| `--ion-z-index-*` | Valores de z-index |

---

## Colors

### Background Colors

Colores de fondo utilizados en la aplicación (modo oscuro).

| Token | Valor | Uso |
|-------|-------|-----|
| `--ion-color-bg-primary` | `#03050A` | Fondo principal de la app |
| `--ion-color-bg-secondary` | `#0A0E17` | Fondo secundario/alternativo |
| `--ion-color-bg-tertiary` | `#121826` | Fondo terciario |
| `--ion-color-bg-card` | `#1A1F2F` | Fondo de tarjetas |
| `--ion-color-bg-card-hover` | `#222837` | Fondo de tarjetas en hover |

**Tailwind equivalent:** `bg-primary`, `bg-secondary`, `bg-tertiary`, `bg-card`, `bg-card-hover`

```scss
// Uso en SCSS
.card {
  background-color: var(--ion-color-bg-card);
  
  &:hover {
    background-color: var(--ion-color-bg-card-hover);
  }
}
```

### Neon Colors

Colores de efecto neón para acentos y brillos.

| Token | Valor | Uso |
|-------|-------|-----|
| `--ion-color-neon-primary` | `#00E0FF` | Neon principal (cyan) |
| `--ion-color-neon-primary-dark` | `#00B8D4` | Neon principal oscurecido |
| `--ion-color-neon-secondary` | `#00F5D4` | Neon secundario (verde turquesa) |
| `--ion-color-neon-secondary-dark` | `#00D9C0` | Neon secundario oscurecido |

**Tailwind equivalent:** `neon-primary`, `neon-secondary`

```scss
// Uso en SCSS - Efecto neon glow
.neon-button {
  box-shadow: 0 0 30px var(--ion-color-neon-primary);
  border: 1px solid var(--ion-color-neon-primary);
}
```

### Text Colors

Colores de texto para jerarquía visual.

| Token | Valor | Uso |
|-------|-------|-----|
| `--ion-color-text-primary` | `#FFFFFF` | Texto principal/encabezados |
| `--ion-color-text-secondary` | `#B0C4DE` | Texto secundario |
| `--ion-color-text-tertiary` | `#7086A0` | Texto terciario/placeholder |
| `--ion-color-text-inverse` | `#03050A` | Texto en fondos claros (inverso) |

**Tailwind equivalent:** `text-primary`, `text-secondary`, `text-tertiary`

```scss
// Uso en SCSS
.title {
  color: var(--ion-color-text-primary);
}

.subtitle {
  color: var(--ion-color-text-secondary);
}

.caption {
  color: var(--ion-color-text-tertiary);
}
```

### Border Colors

Colores de borde con transparencia.

| Token | Valor | Uso |
|-------|-------|-----|
| `--ion-color-border-primary` | `rgba(0, 224, 255, 0.3)` | Borde primario con neon |
| `--ion-color-border-secondary` | `rgba(255, 255, 255, 0.08)` | Borde secundario sutil |

**Tailwind equivalent:** `border-primary`, `border-secondary`

```scss
// Uso en SCSS
.card {
  border: 1px solid var(--ion-color-border-primary);
}

.divider {
  border-bottom: 1px solid var(--ion-color-border-secondary);
}
```

### Semantic Colors (Ionic Standard)

Colores semánticos que siguen el estándar Ionic para compatibilidad.

| Token | Valor | Contrast | Variantes | Uso |
|-------|-------|----------|-----------|-----|
| `--ion-color-primary` | `#00E0FF` | `#03050A` | shade, tint | Color principal (acciones) |
| `--ion-color-secondary` | `#00F5D4` | `#03050A` | shade, tint | Color secundario |
| `--ion-color-tertiary` | `#121826` | `#FFFFFF` | shade, tint | Color terciario |
| `--ion-color-success` | `#00F5D4` | `#03050A` | shade, tint | Éxito/confirmación |
| `--ion-color-warning` | `#B0C4DE` | `#03050A` | shade, tint | Advertencia |
| `--ion-color-danger` | `#ff3b30` | `#FFFFFF` | shade, tint | Error/peligro |
| `--ion-color-dark` | `#1A1F2F` | `#FFFFFF` | shade, tint | Oscuro |
| `--ion-color-medium` | `#7086A0` | `#03050A` | shade, tint | Medio/gris |
| `--ion-color-light` | `#FFFFFF` | `#03050A` | shade, tint | Claro |

**Nota:** Cada color semántico incluye variantes:
- `-shade`: Versión más oscura (para fondos)
- `-tint`: Versión más clara (para énfasis)

```scss
// Uso en Ionic components (automático con ion-color)
<ion-button color="primary">...</ion-button>
<ion-button color="success">...</ion-button>
<ion-button color="danger">...</ion-button>

// Uso directo en SCSS
.success-badge {
  background-color: var(--ion-color-success);
  color: var(--ion-color-success-contrast);
}
```

---

## Typography

### Font Families

| Token | Valor | Uso |
|-------|-------|-----|
| `--ion-font-family-display` | `'Syne', sans-serif` | Encabezados/títulos |
| `--ion-font-family-body` | `'Outfit', sans-serif` | Texto general/cuerpo |
| `--ion-font-family-mono` | `'JetBrains Mono', monospace` | Código/valores técnicos |
| `--ion-font-family` | `'Outfit', ...` | Fuente por defecto del sistema |

**Tailwind equivalent:** `font-display`, `font-body`, `font-mono`

```scss
// Uso en SCSS
h1, h2, h3 {
  font-family: var(--ion-font-family-display);
}

body, p {
  font-family: var(--ion-font-family-body);
}

code, .mono {
  font-family: var(--ion-font-family-mono);
}
```

### Font Sizes

Escala de tamaños de fuente matching Tailwind.

| Token | Valor | px | Tailwind |
|-------|-------|----|----------|
| `--ion-font-size-xs` | `0.75rem` | 12px | `text-xs` |
| `--ion-font-size-sm` | `0.875rem` | 14px | `text-sm` |
| `--ion-font-size-base` | `1rem` | 16px | `text-base` |
| `--ion-font-size-lg` | `1.125rem` | 18px | `text-lg` |
| `--ion-font-size-xl` | `1.25rem` | 20px | `text-xl` |
| `--ion-font-size-2xl` | `1.5rem` | 24px | `text-2xl` |
| `--ion-font-size-3xl` | `1.875rem` | 30px | `text-3xl` |
| `--ion-font-size-4xl` | `2.25rem` | 36px | `text-4xl` |
| `--ion-font-size-5xl` | `3rem` | 48px | `text-5xl` |

```scss
// Uso en SCSS
.small-text {
  font-size: var(--ion-font-size-sm);
}

.heading {
  font-size: var(--ion-font-size-3xl);
}
```

### Font Weights

| Token | Valor | Tailwind |
|-------|-------|----------|
| `--ion-font-weight-light` | `300` | `font-light` |
| `--ion-font-weight-normal` | `400` | `font-normal` |
| `--ion-font-weight-medium` | `500` | `font-medium` |
| `--ion-font-weight-semibold` | `600` | `font-semibold` |
| `--ion-font-weight-bold` | `700` | `font-bold` |

```scss
// Uso en SCSS
.bold {
  font-weight: var(--ion-font-weight-bold);
}

.semibold {
  font-weight: var(--ion-font-weight-semibold);
}
```

### Line Heights

| Token | Valor | Tailwind |
|-------|-------|----------|
| `--ion-line-height-tight` | `1.25` | `leading-tight` |
| `--ion-line-height-normal` | `1.5` | `leading-normal` |
| `--ion-line-height-relaxed` | `1.625` | `leading-relaxed` |

```scss
// Uso en SCSS
.tight {
  line-height: var(--ion-line-height-tight);
}
```

---

## Spacing

Escala de espaciado matching Tailwind.

| Token | Valor | px | Tailwind |
|-------|-------|----|----------|
| `--ion-spacing-xs` | `0.25rem` | 4px | `space-x-1` |
| `--ion-spacing-sm` | `0.5rem` | 8px | `space-x-2` |
| `--ion-spacing-md` | `1rem` | 16px | `space-x-4` |
| `--ion-spacing-lg` | `1.5rem` | 24px | `space-x-6` |
| `--ion-spacing-xl` | `2rem` | 32px | `space-x-8` |
| `--ion-spacing-2xl` | `3rem` | 48px | `space-x-12` |
| `--ion-spacing-3xl` | `4rem` | 64px | `space-x-16` |
| `--ion-spacing-4xl` | `6rem` | 96px | `space-x-24` |

```scss
// Uso en SCSS
.card {
  padding: var(--ion-spacing-md);
  margin-bottom: var(--ion-spacing-lg);
}

.container {
  padding: var(--ion-spacing-xl);
}
```

---

## Border Radius

Escala de radio de borde matching Tailwind.

| Token | Valor | px | Tailwind |
|-------|-------|----|----------|
| `--ion-border-radius-xs` | `4px` | 4px | `rounded-xs` |
| `--ion-border-radius-sm` | `8px` | 8px | `rounded-sm` |
| `--ion-border-radius-md` | `16px` | 16px | `rounded-md` |
| `--ion-border-radius-lg` | `24px` | 24px | `rounded-lg` |
| `--ion-border-radius-xl` | `32px` | 32px | `rounded-xl` |
| `--ion-border-radius-full` | `9999px` | - | `rounded-full` |

```scss
// Uso en SCSS
.button {
  border-radius: var(--ion-border-radius-md);
}

.avatar {
  border-radius: var(--ion-border-radius-full);
}

.card {
  border-radius: var(--ion-border-radius-lg);
}
```

---

## Box Shadow

Sombras matching Tailwind.

| Token | Valor | Tailwind |
|-------|-------|----------|
| `--ion-box-shadow-sm` | `0 4px 12px rgba(0, 0, 0, 0.3)` | `shadow-sm` |
| `--ion-box-shadow-md` | `0 8px 24px rgba(0, 0, 0, 0.4)` | `shadow-md` |
| `--ion-box-shadow-lg` | `0 16px 40px rgba(0, 0, 0, 0.5)` | `shadow-lg` |
| `--ion-box-shadow-neon` | `0 0 30px rgba(0, 224, 255, 0.3)` | `shadow-neon` |
| `--ion-box-shadow-neon-strong` | `0 0 40px rgba(0, 224, 255, 0.5)` | `shadow-neon-strong` |
| `--ion-box-shadow-glass` | `0 8px 32px 0 rgba(0, 0, 0, 0.36)` | `shadow-glass` |

```scss
// Uso en SCSS
.card {
  box-shadow: var(--ion-box-shadow-md);
}

.neon-glow {
  box-shadow: var(--ion-box-shadow-neon);
}

.glass-effect {
  box-shadow: var(--ion-box-shadow-glass);
}
```

---

## Effects

### Backdrop Blur

| Token | Valor | px | Tailwind |
|-------|-------|----|----------|
| `--ion-backdrop-blur-xs` | `4px` | 4px | `backdrop-blur-xs` |
| `--ion-backdrop-blur-sm` | `8px` | 8px | `backdrop-blur-sm` |
| `--ion-backdrop-blur-md` | `12px` | 12px | `backdrop-blur-md` |
| `--ion-backdrop-blur-lg` | `16px` | 16px | `backdrop-blur-lg` |
| `--ion-backdrop-blur-xl` | `24px` | 24px | `backdrop-blur-xl` |

```scss
// Uso en SCSS
.glass-modal {
  backdrop-filter: blur(var(--ion-backdrop-blur-lg));
  background: rgba(26, 31, 47, 0.8);
}
```

### Gradients

| Token | Valor | Tailwind |
|-------|-------|----------|
| `--ion-gradient-glow` | `linear-gradient(135deg, rgba(0, 224, 255, 0.2) 0%, rgba(0, 245, 212, 0.2) 50%, rgba(0, 224, 255, 0.2) 100%)` | `bg-gradient-glow` |
| `--ion-gradient-card` | `linear-gradient(145deg, #1A1F2F 0%, #121826 100%)` | `bg-gradient-card` |
| `--ion-gradient-radial` | `radial-gradient(circle at center, rgba(0,224,255,0.15) 0%, transparent 70%)` | `bg-gradient-radial` |

```scss
// Uso en SCSS
.hero-section {
  background: var(--ion-gradient-glow);
}

.card {
  background: var(--ion-gradient-card);
}

.spotlight {
  background: var(--ion-gradient-radial);
}
```

---

## Transitions

| Token | Valor | Uso |
|-------|-------|-----|
| `--ion-transition-fast` | `150ms ease` | Transiciones rápidas (hover) |
| `--ion-transition-normal` | `300ms ease` | Transiciones normales |
| `--ion-transition-slow` | `500ms ease` | Transiciones lentas (animaciones) |

```scss
// Uso en SCSS
.button {
  transition: all var(--ion-transition-normal);
}

.fast-hover {
  transition: all var(--ion-transition-fast);
}
```

---

## Z-Index

| Token | Valor | Uso |
|-------|-------|-----|
| `--ion-z-index-dropdown` | `1000` | Menús dropdown |
| `--ion-z-index-sticky` | `1020` | Headers sticky |
| `--ion-z-index-fixed` | `1030` | Elementos fixed |
| `--ion-z-index-modal-backdrop` | `1040` | Backdrop de modales |
| `--ion-z-index-modal` | `1050` | Contenido de modales |
| `--ion-z-index-popover` | `1060` | Popovers |
| `--ion-z-index-tooltip` | `1070` | Tooltips |

```scss
// Uso en SCSS
.modal {
  z-index: var(--ion-z-index-modal);
}

.tooltip {
  z-index: var(--ion-z-index-tooltip);
}
```

---

## Breakpoints

| Token | Valor | px | Ionic |
|-------|-------|----|-------|
| `--ion-breakpoint-sm` | `576px` | 576px | `@media (min-width: 576px)` |
| `--ion-breakpoint-md` | `768px` | 768px | `@media (min-width: 768px)` |
| `--ion-breakpoint-lg` | `992px` | 992px | `@media (min-width: 992px)` |
| `--ion-breakpoint-xl` | `1200px` | 1200px | `@media (min-width: 1200px)` |
| `--ion-breakpoint-2xl` | `1400px` | 1400px | `@media (min-width: 1400px)` |

```scss
// Uso en SCSS
@media (min-width: var(--ion-breakpoint-md)) {
  .responsive-layout {
    flex-direction: row;
  }
}
```

---

## Mapping Tailwind → Ionic

Esta tabla muestra la equivalencia directa entre tokens de Tailwind y los tokens Ionic de TurnoYa.

### Colors

| Tailwind | Ionic Token |
|----------|-------------|
| `bg-primary` | `var(--ion-color-bg-primary)` |
| `bg-secondary` | `var(--ion-color-bg-secondary)` |
| `bg-tertiary` | `var(--ion-color-bg-tertiary)` |
| `bg-card` | `var(--ion-color-bg-card)` |
| `bg-card-hover` | `var(--ion-color-bg-card-hover)` |
| `neon-primary` | `var(--ion-color-neon-primary)` |
| `neon-secondary` | `var(--ion-color-neon-secondary)` |
| `text-primary` | `var(--ion-color-text-primary)` |
| `text-secondary` | `var(--ion-color-text-secondary)` |
| `text-tertiary` | `var(--ion-color-text-tertiary)` |
| `border-primary` | `var(--ion-color-border-primary)` |
| `border-secondary` | `var(--ion-color-border-secondary)` |

### Typography

| Tailwind | Ionic Token |
|----------|-------------|
| `font-display` | `var(--ion-font-family-display)` |
| `font-body` | `var(--ion-font-family-body)` |
| `font-mono` | `var(--ion-font-family-mono)` |
| `text-xs` | `var(--ion-font-size-xs)` |
| `text-sm` | `var(--ion-font-size-sm)` |
| `text-base` | `var(--ion-font-size-base)` |
| `text-lg` | `var(--ion-font-size-lg)` |
| `text-xl` | `var(--ion-font-size-xl)` |
| `text-2xl` | `var(--ion-font-size-2xl)` |
| `text-3xl` | `var(--ion-font-size-3xl)` |
| `text-4xl` | `var(--ion-font-size-4xl)` |
| `text-5xl` | `var(--ion-font-size-5xl)` |
| `font-light` | `var(--ion-font-weight-light)` |
| `font-normal` | `var(--ion-font-weight-normal)` |
| `font-medium` | `var(--ion-font-weight-medium)` |
| `font-semibold` | `var(--ion-font-weight-semibold)` |
| `font-bold` | `var(--ion-font-weight-bold)` |
| `leading-tight` | `var(--ion-line-height-tight)` |
| `leading-normal` | `var(--ion-line-height-normal)` |
| `leading-relaxed` | `var(--ion-line-height-relaxed)` |

### Spacing

| Tailwind | Ionic Token |
|----------|-------------|
| `space-x-1` / `p-1` | `var(--ion-spacing-xs)` |
| `space-x-2` / `p-2` | `var(--ion-spacing-sm)` |
| `space-x-4` / `p-4` | `var(--ion-spacing-md)` |
| `space-x-6` / `p-6` | `var(--ion-spacing-lg)` |
| `space-x-8` / `p-8` | `var(--ion-spacing-xl)` |
| `space-x-12` / `p-12` | `var(--ion-spacing-2xl)` |
| `space-x-16` / `p-16` | `var(--ion-spacing-3xl)` |
| `space-x-24` / `p-24` | `var(--ion-spacing-4xl)` |

### Border Radius

| Tailwind | Ionic Token |
|----------|-------------|
| `rounded-xs` | `var(--ion-border-radius-xs)` |
| `rounded-sm` | `var(--ion-border-radius-sm)` |
| `rounded-md` | `var(--ion-border-radius-md)` |
| `rounded-lg` | `var(--ion-border-radius-lg)` |
| `rounded-xl` | `var(--ion-border-radius-xl)` |
| `rounded-full` | `var(--ion-border-radius-full)` |

### Box Shadow

| Tailwind | Ionic Token |
|----------|-------------|
| `shadow-sm` | `var(--ion-box-shadow-sm)` |
| `shadow-md` | `var(--ion-box-shadow-md)` |
| `shadow-lg` | `var(--ion-box-shadow-lg)` |
| `shadow-neon` | `var(--ion-box-shadow-neon)` |
| `shadow-neon-strong` | `var(--ion-box-shadow-neon-strong)` |
| `shadow-glass` | `var(--ion-box-shadow-glass)` |

### Backdrop Blur

| Tailwind | Ionic Token |
|----------|-------------|
| `backdrop-blur-xs` | `var(--ion-backdrop-blur-xs)` |
| `backdrop-blur-sm` | `var(--ion-backdrop-blur-sm)` |
| `backdrop-blur-md` | `var(--ion-backdrop-blur-md)` |
| `backdrop-blur-lg` | `var(--ion-backdrop-blur-lg)` |
| `backdrop-blur-xl` | `var(--ion-backdrop-blur-xl)` |

---

## Ejemplos de Uso

### Componente Card

```scss
.card {
  background: var(--ion-gradient-card);
  border-radius: var(--ion-border-radius-lg);
  box-shadow: var(--ion-box-shadow-md);
  padding: var(--ion-spacing-md);
  transition: all var(--ion-transition-normal);
  
  &:hover {
    background: var(--ion-color-bg-card-hover);
    box-shadow: var(--ion-box-shadow-neon);
  }
}
```

### Botón Neon

```scss
.neon-button {
  background: transparent;
  border: 1px solid var(--ion-color-neon-primary);
  border-radius: var(--ion-border-radius-md);
  color: var(--ion-color-neon-primary);
  font-family: var(--ion-font-family-body);
  font-size: var(--ion-font-size-base);
  font-weight: var(--ion-font-weight-medium);
  padding: var(--ion-spacing-sm) var(--ion-spacing-lg);
  box-shadow: var(--ion-box-shadow-neon);
  transition: all var(--ion-transition-normal);
  
  &:hover {
    background: var(--ion-color-neon-primary);
    color: var(--ion-color-text-inverse);
    box-shadow: var(--ion-box-shadow-neon-strong);
  }
}
```

### Texto con Jerarquía

```scss
.heading-1 {
  font-family: var(--ion-font-family-display);
  font-size: var(--ion-font-size-4xl);
  font-weight: var(--ion-font-weight-bold);
  color: var(--ion-color-text-primary);
  line-height: var(--ion-line-height-tight);
}

.heading-2 {
  font-family: var(--ion-font-family-display);
  font-size: var(--ion-font-size-3xl);
  font-weight: var(--ion-font-weight-semibold);
  color: var(--ion-color-text-primary);
}

.body-text {
  font-family: var(--ion-font-family-body);
  font-size: var(--ion-font-size-base);
  font-weight: var(--ion-font-weight-normal);
  color: var(--ion-color-text-secondary);
  line-height: var(--ion-line-height-relaxed);
}

.caption {
  font-family: var(--ion-font-family-body);
  font-size: var(--ion-font-size-sm);
  color: var(--ion-color-text-tertiary);
}
```

### Modal con Glass Effect

```scss
.glass-modal {
  background: rgba(26, 31, 47, 0.9);
  backdrop-filter: blur(var(--ion-backdrop-blur-lg));
  border-radius: var(--ion-border-radius-xl);
  box-shadow: var(--ion-box-shadow-glass);
  z-index: var(--ion-z-index-modal);
}
```

### Uso en Componentes Ionic (TSX)

```tsx
// Ionic component con tokens
<IonCard class="card">
  <IonCardHeader>
    <IonCardTitle class="heading-2">Título</IonCardTitle>
  </IonCardHeader>
  <IonCardContent>
    <p class="body-text">Contenido...</p>
  </IonCardContent>
</IonCard>

// Personalización de variables CSS
:host {
  --ion-color-primary: #{var(--ion-color-primary)};
  --ion-color-background: #{var(--ion-color-bg-primary)};
}
```

---

## Animaciones Activas

Las siguientes animaciones están disponibles en la aplicación:

| Nombre | Descripción | Uso |
|--------|-------------|-----|
| `float` | Movimiento vertical suave (6s) | Elementos decorativos |
| `glow` | Efecto de brillo pulsante (2s) | Neons y acentos |
| `pulse-slow` | Pulso lento (3s) | Loading states |
| `spin-slow` | Rotación lenta (8s) | Spinners |

**Tailwind equivalent:** `animate-float`, `animate-glow`, `animate-pulse-slow`, `animate-spin-slow`

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `src/theme/variables.scss` | Definición de todos los tokens |
| `src/global.scss` | Estilos globales y utilities |
| `tailwind.config.js` | Configuración de referencia (no editar) |

---

## Notas de Implementación

1. **Orden de import**: `global.scss` debe importar `variables.scss` al inicio
2. **Fallback**: Todos los tokens tienen valores por defecto, funcionan sin Tailwind
3. **No hardcoded**: Evitar colores, tamaños o spacing hardcoded; usar tokens siempre
4. **Consistencia**: Verificar que componentes usen tokens matching Tailwind
