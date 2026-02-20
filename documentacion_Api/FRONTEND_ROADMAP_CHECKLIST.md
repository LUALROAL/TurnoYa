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
- [ ] Cambios de estado de cita (Priority: High, Points: 3, Depends: F-042)

## EPIC 6 - Pagos y administracion
- [ ] Integrar crear intento de pago (Priority: Medium, Points: 3, Depends: F-040)
- [ ] Integrar estado de pago (Priority: Medium, Points: 2, Depends: F-050)
- [ ] Modulo admin usuarios (Priority: Low, Points: 5, Depends: F-014)

## EPIC 7 - Calidad y entrega
- [ ] Estandarizar contratos de API frontend (Priority: Medium, Points: 3, Depends: F-004)
- [ ] Observabilidad frontend minima (Priority: Low, Points: 2, Depends: F-006)
- [ ] Checklist de salida a QA (Priority: High, Points: 1, Depends: F-011, F-012, F-013, F-023, F-030, F-031, F-040, F-043, F-050, F-051)

## Mejoras futuras (post-MVP)
- [ ] Optimizar filtros con RxJS `switchMap` para cancelar requests anteriores en tipeo rapido
- [ ] Agregar `distinctUntilChanged` en filtros para evitar consultas repetidas con el mismo valor
- [ ] Definir umbral minimo de busqueda (ej. 2 caracteres) antes de consultar backend
- [ ] Mostrar estado de "sin conexion" y opcion de reintento en listado de negocios
