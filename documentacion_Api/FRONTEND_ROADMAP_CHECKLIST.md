# TurnoYa Frontend - Roadmap Checklist

Use this checklist to mark each card as completed.

## EPIC 1 - Bootstrap
- [x] Crear proyecto Ionic Angular (Priority: High, Points: 3) X
- [x] Configurar Tailwind CSS (Priority: High, Points: 2, Depends: F-001) X
- [x] Configurar entornos y API base URL (Priority: High, Points: 1, Depends: F-001) X
- [x] Crear cliente HTTP base (Priority: High, Points: 3, Depends: F-003) X
- [x] Implementar interceptor JWT (Priority: High, Points: 2, Depends: F-004) X
- [x] Manejo global de errores HTTP (Priority: High, Points: 3, Depends: F-005) X

## EPIC 2 - Autenticacion
- [x] Crear modulo/paginas de Auth (Priority: High, Points: 5, Depends: F-002, F-004) X
- [x] Integrar endpoint register (Priority: High, Points: 2, Depends: F-010) X
- [x] Integrar endpoint login (Priority: High, Points: 2, Depends: F-010) X
- [x] Implementar refresh automatico (Priority: High, Points: 3, Depends: F-012, F-005, F-006) X
- [x] Guard de rutas protegidas (Priority: High, Points: 2, Depends: F-012) X

## EPIC 3 - Catalogo y negocios
- [x] Configurar pagina Home y navegacion inicial (Priority: High, Points: 3, Depends: F-012) X
- [x] Home: layout base y header de bienvenida (Priority: High, Points: 2, Depends: F-020) X
- [x] Home: accesos rapidos a Negocios, Mis citas y Perfil (Priority: Medium, Points: 2, Depends: F-020) X
- [x] Home: estado vacio y carga inicial de datos (Priority: Medium, Points: 2, Depends: F-020) X
- [x] Crear pagina listado de negocios (Priority: High, Points: 5, Depends: F-004) X
- [x] Implementar busqueda y filtros (Priority: Medium, Points: 3, Depends: F-020) X
- [x] Crear detalle de negocio (Priority: High, Points: 5, Depends: F-020) X
- [x] Crear modulo owner business (Priority: High, Points: 8, Depends: F-014, F-004) X
- [x] Configuracion de negocio (Priority: Medium, Points: 5, Depends: F-023) X

## EPIC 4 - Servicios y empleados
- [x] CRUD servicios de negocio (Priority: High, Points: 5, Depends: F-023) X
- [x] CRUD empleados de negocio (Priority: High, Points: 5, Depends: F-023) X

## EPIC 5 - Citas
- [x] Crear flujo agendar cita (Priority: High, Points: 8, Depends: F-022, F-030, F-031) X
- [x] Mis citas (cliente) (Priority: High, Points: 3, Depends: F-040) X
- [x] Agenda de negocio (owner) (Priority: High, Points: 5, Depends: F-023) X
- [x] Cambios de estado de cita (Priority: High, Points: 3, Depends: F-042) X

## EPIC 6 - Pagos y administracion
- [ ] Integrar crear intento de pago (Priority: Medium, Points: 3, Depends: F-040)
- [ ] Integrar estado de pago (Priority: Medium, Points: 2, Depends: F-050)
- [x] Modulo perfil y cuenta (Priority: Medium, Points: 5, Depends: F-012)
- [x] Editar datos personales (Priority: Medium, Points: 3, Depends: F-012)
- [x] Cambiar contraseña (Priority: Medium, Points: 3, Depends: F-012)
- [x] Cerrar sesion (Priority: Medium, Points: 1, Depends: F-012) - Implementado: Se agregó método `logout()` en el servicio de sesión y botón en el menú/perfil que limpia el token y redirige a login.
- [x] Modulo admin usuarios (Priority: Low, Points: 5, Depends: F-014)

## EPIC 7 - Calidad y entrega
- [ ] Estandarizar contratos de API frontend (Priority: Medium, Points: 3, Depends: F-004)
- [ ] Observabilidad frontend minima (Priority: Low, Points: 2, Depends: F-006)
- [ ] Checklist de salida a QA (Priority: High, Points: 1, Depends: F-011, F-012, F-013, F-023, F-030, F-031, F-040, F-043, F-050, F-051)

## Mejoras futuras (post-MVP)
- [ ] Optimizar filtros con RxJS `switchMap` para cancelar requests anteriores en tipeo rapido
- [ ] Agregar `distinctUntilChanged` en filtros para evitar consultas repetidas con el mismo valor
- [ ] Definir umbral minimo de busqueda (ej. 2 caracteres) antes de consultar backend
- [ ] Mostrar estado de "sin conexion" y opcion de reintento en listado de negocios

## Mejoras en curso

- [x] Autocompletar ciudades en filtro de negocios (frontend/backend)
  - Nota: Actualmente se usa OpenStreetMap Nominatim para autocompletar ciudades y obtener coordenadas sin costo ni registro. Cuando se cuente con recursos o se requiera mayor cobertura global, se recomienda migrar a Google Maps Platform.
  - Para mapas interactivos y geolocalización, se recomienda usar la librería open source Leaflet junto con OpenStreetMap. Si se requiere integración avanzada (direcciones, rutas, geocodificación inversa), existen servicios open source y comerciales compatibles con OSM.
  - Descripción: Mejorar el filtro de ciudad en el listado de negocios para que sugiera ciudades a medida que el usuario escribe, usando autocompletado tipo Google Places o similar.
  - Implementación: Se agregó el script de Google Maps JavaScript API con Places y la API key en index.html. El input de ciudad ahora muestra sugerencias de autocompletado y permite seleccionar una ciudad, actualizando el filtro y recargando los negocios.
  - Estado: completado (frontend). Backend opcional pendiente.

## CARs para autocompletar ciudades con OpenStreetMap

- [ ] Paso 1: Integrar autocompletado de ciudades usando la API pública de OpenStreetMap Nominatim en el filtro de negocios.
  - El usuario escribe parte del nombre de la ciudad y se muestran sugerencias en tiempo real.
  - No requiere API key ni registro para uso básico.
  - Endpoint usado: https://nominatim.openstreetmap.org/search?country=Colombia&city={query}&format=json&addressdetails=1&limit=5

- [ ] Paso 2: Al seleccionar una ciudad, guardar el nombre y (opcional) las coordenadas para futuras funcionalidades (mapas, geolocalización, rutas, etc).

- [ ] Paso 3: (Futuro) Integrar mapas interactivos usando Leaflet y OpenStreetMap para mostrar negocios y ubicaciones.

- [ ] Paso 4: (Futuro) Implementar geocodificación inversa y rutas usando servicios compatibles con OSM (ej: Nominatim, OSRM).

- [ ] Paso 5: (Futuro) Si se requiere cobertura global o funcionalidades avanzadas, migrar a Google Maps Platform y documentar el proceso.
