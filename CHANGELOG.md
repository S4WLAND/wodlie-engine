# Changelog — `@s4wland/wodlie-engine`

## [Unreleased] — 2026-04-24

### Añadido
- modelo canónico mínimo en `.wodlie-config/`
- `business.json`, `architecture.json` y `events.jsonl`
- comandos `business:epic:create`, `business:story:create`, `business:story:status`, `business:pivot`
- comando `dev:story:complete`
- comando `business:sync`
- comando `reconcile`
- derivación de `overview.md` y `.business/progress.*` desde el modelo canónico
- borrador semanal alimentado por historias y eventos
- smoke tests por script contra `dist/`
- shell interactiva al ejecutar `wodlie` sin argumentos
- paleta de acciones y slash commands para operar el engine sin memorizar flags
- prompts guiados para épicos, historias, estados, reportes y utilidades frecuentes
- `AGENTS.md` en raíz con reglas de desarrollo, documentación y convención de commits

### Cambiado
- `status` ahora sincroniza negocio canónico antes de recalcular salud
- `trigger` ahora registra eventos y usa la lógica de negocio canónica
- `report:draft` y `report` reflejan mejor el estado real del modelo
- `build` ahora copia templates a `dist/`
- `init` ahora pregunta también por `type`, `size`, `stack` e `infra`
- `init` ahora recorta la generación del template según infraestructura, tamaño, perfil y capabilities seleccionadas
- el binario y nombre visible de la CLI ahora es `wodlie-engine`

### Aclarado
- solo `node-fastify` está implementado
- `deploy`, `deliver`, `reimport` y `upgrade` siguen siendo flujos guiados o planificados
- la generación selectiva hoy recorta principalmente `.infra/`; la composición profunda de `.dev/` por perfil/capabilities sigue pendiente

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
