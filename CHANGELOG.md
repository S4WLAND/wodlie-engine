# Changelog — `@s4wland/wodlie-engine`

## [Unreleased] — 2026-05-10

### Añadido
- bootstrap `project-bootstrap` con raíz común y presets por servicio
- modos `neutral|fastify` para `backend-api`
- modos `neutral|nextjs` para `frontend-public` y `frontend-admin`
- `service_modes` en `.wodlie-config/project.json` y `architecture.json`
- documentación y `AGENTS.md` por servicio en presets runnable y neutral
- `.github/workflows/README.md` en la raíz del bootstrap
- `service-ops.md` en `.infra/vps/`
- `COMPOSE_PROFILES` para activar Redis y MinIO como servicios opcionales
- `colors.mjs` y salida más clara en `.infra/scripts/env/index.mjs`
- `dev:shell` y `test:shell` por servicio en el bootstrap generado

### Cambiado
- `init` ya no copia `node-fastify`; ahora compone el proyecto desde `project-bootstrap`
- `init` ahora pregunta el modo de cada servicio y copia el preset seleccionado a `.dev/src/<service>/`
- `infra:sync` ahora regenera una documentación alineada con Docker local `dev/test`, perfiles opcionales y composición por servicio
- `env:sync` ya delegaba al script del proyecto; ahora la superficie documental y de stack queda alineada con esa delegación
- `compose.base.yml` mueve Redis y MinIO a profiles opcionales
- `compose.dev.yml` y `compose.test.yml` dejan de depender duramente de Redis/MinIO
- `compose.test.yml` agrega healthcheck de backend
- `update-test-service.ps1` ahora resuelve el `project-name` desde `stack.test.env`
- `logs` ahora muestra primero el resumen del stack y `catalog.json` evita reescrituras sin cambios
- el build deja de compilar `src/templates/` como código TypeScript del engine
- `overview.md` ahora muestra la composición real por servicio cuando existe `service_modes`

### Documentación
- `README.md`, `docs/getting-started.md`, `docs/templates.md`, `docs/commands.md`, `docs/current-state.md`, `docs/deployment.md` y `docs/agents.md` ahora describen el bootstrap híbrido y el estado real actual

## [1.0.0] — 2026-04-23

### Añadido
- `wodlie init` — inicialización de proyectos con template node-fastify
- `wodlie status` — actualización de state.json + progress.json + changelog.md
- `wodlie health` — visualización de salud del proyecto en consola
- `wodlie env:sync` — sincronización de variables de entorno
- `wodlie report:draft` — generación de borrador de reporte semanal
- `wodlie report` — generación de .tex para reporte cliente
- `wodlie deploy` — deploy por entorno y target
- `wodlie ssh:verify` — verificación de conexión SSH con VPS
- `wodlie module:add` — importación de módulo desde otro proyecto
- `wodlie module:remove` — remoción limpia de módulo con modo plan
- `wodlie trigger` — disparo manual de triggers
- `wodlie export` — generación de .wodlie-export/
- `wodlie purge` — remoción del engine del proyecto
- `wodlie deliver` — entrega completa al cliente
- `wodlie reimport` — reactivación del engine en proyecto del cliente
- `wodlie upgrade` — información de actualizaciones disponibles
- `wodlie upgrade --apply` — aplicación de actualización del engine
- Template node-fastify completo con 4 capas: BUSINESS, INFRA, DEV, CORE
- Sistema de STATE_ADAPTER: git (default) → postgres (plataforma futura)
- GitHub Actions: test.yml, deploy-staging.yml, deploy-prod.yml
- Soporte para rollback automático via git stash en operaciones destructivas
