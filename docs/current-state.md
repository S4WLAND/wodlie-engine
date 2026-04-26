# Current State

## Qué existe hoy

### Núcleo canónico

- `.wodlie-config/project.json`
- `.wodlie-config/business.json`
- `.wodlie-config/architecture.json`
- `.wodlie-config/events.jsonl`

### Comandos estructurales

- `init`
- `business:epic:create`
- `business:epic:list`
- `business:epic:edit`
- `business:epic:status`
- `business:story:create`
- `business:story:list`
- `business:story:edit`
- `business:story:status`
- `business:pivot`
- `business:sync`
- `dev:story:complete`
- `status`
- `health`
- `report:draft`
- `report`
- `env:sync`
- `ssh:verify`
- `export`
- `purge`
- `reconcile`

### Comandos guiados o parciales

- `module:add`
- `module:remove`
- `deploy`
- `deliver`

### Comandos planificados

- `reimport`
- `upgrade`

## Qué sincroniza realmente el engine

- negocio canónico -> `overview.md`
- negocio canónico -> `.business/progress.*`
- negocio + métricas -> `.core/state.json`
- eventos -> reportes semanales
- `dev:story:complete` -> estado de historia en negocio
- triggers manuales -> eventos y estado

## Qué no está resuelto todavía

### Interfaz agentica

- no hay MCP server
- la CLI ya tiene shell en árbol para operar negocio y reportes sin memorizar IDs

### Variabilidad del framework

- no hay composición real de templates por `type`, `size`, `infra` o `capabilities`
- no hay reconciliación estructural completa si cambia el perfil

### Portabilidad de módulos

- `module:add` solo copia carpetas
- no existe análisis de compatibilidad ni adaptación automática
- no hay contrato machine-readable por módulo

### CI/CD y eventos

- no se parsean commits para disparar eventos
- no hay workflow del engine que gobierne estado automáticamente
- deploy y deliver siguen siendo flujos guiados

### Estado multi-capa

- negocio es la capa más conectada
- infra y dev todavía no producen métricas derivadas profundas
- changelog no se consolida automáticamente desde git
- las métricas nuevas viven sobre estados `draft/ready/in-progress/in-review/blocked/completed/pivoted/archived`

## Qué faltaría para acercarse a la visión completa

- MCP sobre los mismos casos de uso de la CLI
- reconciliador de drift entre modelo, docs y proyecto generado
- surface de decisiones de arquitectura e infra más rica
- grafo de dependencias de módulos
- eventos provenientes de commits, CI/CD y resultados de pruebas
- reporte cliente más automatizado
- upgrade y reimport reales
