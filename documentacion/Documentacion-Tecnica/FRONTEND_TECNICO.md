# TurnoYa - Documentacion Tecnica Frontend

Este documento se completa punto por punto segun el checklist de frontend.

## Estado de avance
  - [x] Crear proyecto Ionic Angular
  - [x] Configurar Tailwind CSS
  - [x] Configurar entornos y API base URL
  - [x] Crear cliente HTTP base
  - [x] Implementar interceptor JWT
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

## Interceptor JWT
- Archivo: src/app/core/interceptors/auth.interceptor.ts
- Storage: localStorage (key: turnoya.session)
- Excluye rutas publicas: /api/auth/login, /api/auth/register, /api/auth/refresh, /api/payments/webhook

## Cliente HTTP base
- Ubicacion: src/app/core/services/api.service.ts
- Metodos: get, post, put, patch, delete
- Base URL: environment.apiBaseUrl
- Params: soporta query params tipados

## Entornos y API base
- Desarrollo: src/environments/environment.ts
  - apiBaseUrl: https://localhost:7187
- Produccion: src/environments/environment.prod.ts
  - apiBaseUrl: https://api.turnoya.com

## Notas de implementacion
- Proyecto inicializado con template blank.
- Bootstrap con `bootstrapApplication` y routing por `loadComponent`.
- Tailwind habilitado con tokens de diseno base (Tech Pro).
- Base URL de API definida por ambiente (dev/prod).
- Cliente HTTP base listo para servicios por modulo.
- Sesion y JWT gestionados por interceptor y storage local.
