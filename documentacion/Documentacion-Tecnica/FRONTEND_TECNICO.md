# TurnoYa - Documentacion Tecnica Frontend

Este documento se completa punto por punto segun el checklist de frontend.

## Estado de avance
  - [x] Crear proyecto Ionic Angular
  - [x] Configurar Tailwind CSS
  - [ ] Configurar entornos y API base URL
  - [ ] Crear cliente HTTP base
  - [ ] Implementar interceptor JWT
  - [ ] Manejo global de errores HTTP

## Base tecnica

## Tailwind CSS
- Dependencias: tailwindcss@3.4.17, postcss, autoprefixer (dev)
- Nota: se usa Tailwind v3 por compatibilidad con el builder de Angular.
- Config: tailwind.config.js y postcss.config.js en la raiz del proyecto
- Estilos globales: directivas Tailwind agregadas en src/global.scss
- Tokens Tech Pro: src/theme/tokens.css importado en global.scss

## Endpoints conectados
- Ninguno aun (se documentara al implementar cada card)

## Notas de implementacion
- Proyecto inicializado con template blank.
- Bootstrap con `bootstrapApplication` y routing por `loadComponent`.
- Tailwind habilitado con tokens de diseno base (Tech Pro).
