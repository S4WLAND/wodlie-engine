# Env — Infra

## Propósito

Este directorio concentra los archivos compartidos de infraestructura para entornos locales y expose de `test`.

## Archivos versionados

- `stack.dev.env.example` — defaults compartidos del stack `dev`
- `stack.test.env.example` — defaults compartidos del stack `test`
- `test-expose.env.example` — plantilla para exponer/cerrar `test`
- `catalog.json` — catálogo generado desde los `.env.example` de cada app

## Archivos no versionados

- `stack.dev.env`
- `stack.test.env`
- `test-expose.env`
- `.infra/state/**`

Se crean con `npm run env:sync`.

## Regla

Los `.env.example` de cada app siguen siendo la fuente de verdad de claves técnicas.

`.infra/env/` no reemplaza esos archivos: sólo materializa configuración compartida para Docker, expose y operación local.

## Flujo real

- `.dev/src/<app>/.env.example` define qué claves necesita cada app
- `stack.dev.env` y `stack.test.env` definen valores operativos del stack Docker
- `npm run env:sync` crea estos archivos por app si faltan:
  - `.dev/src/backend-api/.env.development`
  - `.dev/src/backend-api/.env.test`
  - `.dev/src/frontend-public/.env.development`
  - `.dev/src/frontend-public/.env.test`
  - `.dev/src/frontend-admin/.env.development`
  - `.dev/src/frontend-admin/.env.test`
- `test-expose.env` no configura la app ni Docker: sólo configura cómo exponer o cerrar el stack `test` desde el VPS
- `publish.env` queda sólo como compatibilidad transitoria interna; la fuente actual y documentada es `test-expose.env`
