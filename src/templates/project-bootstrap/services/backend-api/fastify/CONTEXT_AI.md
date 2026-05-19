# Context AI — Backend API

Decisiones técnicas, gotchas y deuda conocida del backend.

> Última actualización: {{DATE}}

## Resumen ejecutivo

API REST en Fastify + PostgreSQL con arquitectura modular:

- screaming architecture a nivel `modules/`
- clean architecture liviana dentro de cada módulo
- sin contenedor DI global

La base arranca vacía a propósito: plugins globales, `/health`, configuración y `_template` alineado al patrón real.

## Decisiones técnicas

### Fastify

- plugin system predecible
- buen soporte TypeScript
- base HTTP liviana para módulos independientes

Trade-off: ecosistema más chico que Express; algunas integraciones pueden requerir wrappers.

### Módulos con `domain/use-cases/infra/http`

- `domain/` define contratos y tipos
- `use-cases/` orquesta reglas de negocio
- `infra/` resuelve DB o providers concretos
- `http/` define contratos, controller y routes

Cada módulo hace su wiring en `composition.ts`.

### Adaptadores intercambiables

- cache: `memory` o `redis`
- queue: `graphile` o `redis`

La selección se hace por env var para evitar acoplar negocio a infraestructura opcional.

## Estado inicial

- `/health` disponible
- DB lazy / opcional hasta que exista un módulo persistente
- workers placeholder
- `_template` listo para copiar y adaptar

## Recordatorios

- si aparece una env var nueva, reflejarla en `.env.example`
- si un módulo usa persistencia, documentar schema y migraciones
- si Redis pasa a ser obligatorio o cambia la estrategia de media local, actualizar también `.infra/docker/*` y `.infra/env/*`
