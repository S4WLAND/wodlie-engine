# Current State

## Implementado hoy

### Núcleo canónico

- `.wodlie-config/project.json`
- `.wodlie-config/business.json`
- `.wodlie-config/architecture.json`
- `.wodlie-config/events.jsonl`

### Bootstrap

- `init` con composición por servicio
- presets `neutral`, `fastify` y `nextjs`
- `service_modes` persistidos en `project.json`
- `AGENTS.md` y documentación por capa/servicio

### Infra local

- `.infra/docker/compose.base.yml`
- overlays `dev` y `test`
- `env:sync` delegado a `.infra/scripts/env/index.mjs`
- Redis opcional vía `COMPOSE_PROFILES=redis`
- `media-nginx` activo por defecto para uploads locales
- `test:open` / `test:expose` con URLs públicas temporales
- helper robusto `.infra/scripts/ci/update-test-service.ps1`
- workflows base para test por servicio y promoción manual granular a producción

### Negocio y reportes

- épicos, historias, estados y pivots
- sincronización de `overview.md` y `.business/progress.*`
- `status`, `health`, `report:draft` y `report`

## Parcial o guiado

- `deploy`
- `deliver`
- `module:add`
- `module:remove`

## No resuelto todavía

- MCP
- comando dedicado para cambiar presets después de `init`
- soporte runnable para stacks no Node dentro del bootstrap
- CI/CD requiere completar secrets/vars y apps remotas por proyecto antes de quedar operativa
- reimport/upgrade end-to-end
- reconciliación estructural profunda entre plantilla, proyecto y drift manual
