# Infraestructura — {{PROJECT_NAME}}

Esta capa concentra:

- Docker local (`dev` y `test`)
- sincronización de envs
- scripts de operación
- runbooks del proveedor remoto seleccionado

El archivo se regenera con `wodlie-engine infra:sync` a partir de `.wodlie-config/project.json`.

Punto de entrada:

- `docker/` → compose base y overlays
- `env/` → templates y catálogo de variables
- `scripts/` → comandos de operación local y CI
- `{{INFRA_TYPE}}/` → runbooks del objetivo remoto actual
