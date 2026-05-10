# Referencia de Comandos — Estado Real

Estados usados:

- `implemented`: funcional y conectado al modelo actual
- `guided`: útil, pero deja pasos manuales
- `planned`: placeholder o flujo todavía incompleto

## Shell interactiva

### `wodlie-engine`

Estado: `implemented`

Abre una shell con menús:

- `Business`
- `Infra`
- `Reports`
- `Project`

## Inicialización

### `wodlie-engine init <proyecto>`

Estado: `implemented`

Compone un proyecto nuevo desde `project-bootstrap`.

Flags:

- `--type <tipo>` → `webapp|platform|enterprise|iot`
- `--size <tamaño>` → `small|medium|large`
- `--stack <stack>` → `node|python|go`
- `--infra <infra>` → `vps|hosting|cloud`
- `--capabilities <caps>` → `ai,automation,native,realtime,media`

Además pregunta por:

- cliente, operador, dominio y email
- tipo de contrato
- modo de `backend-api`
- modo de `frontend-public`
- modo de `frontend-admin`

Efecto real:

- copia la raíz del bootstrap
- copia el preset elegido a `.dev/src/<service>`
- persiste `service_modes` en `.wodlie-config/project.json`
- regenera `.infra/` documental desde `project.json`
- inicializa git

Limitaciones:

- `--stack` hoy es metadata de compatibilidad; no selecciona un stack runnable distinto
- el stack Docker preconfigurado sólo queda listo con `backend-api=fastify`, `frontend-public=nextjs`, `frontend-admin=nextjs`

## Entornos y variables

### `wodlie-engine env:sync`

Estado: `implemented`

Si existe `.infra/scripts/env/index.mjs`, delega ahí.
En proyectos nuevos esa es la ruta normal.

Resultado esperado:

- crea o completa `.env.development` y `.env.test` por servicio
- crea o completa `.infra/env/stack.dev.env`
- crea o completa `.infra/env/stack.test.env`
- crea o completa `.infra/env/test-expose.env`
- genera `.infra/env/catalog.json`

### Scripts `npm` del proyecto generado

Estado: `implemented`

- `npm run env:sync`
- `npm run env:check`
- `npm run dev:up`
- `npm run dev:down`
- `npm run dev:logs`
- `npm run dev:shell <servicio>`
- `npm run test:up`
- `npm run test:down`
- `npm run test:logs`
- `npm run test:shell <servicio>`
- `npm run test:expose`
- `npm run test:close`
- `npm run infra:status`
- `npm run infra:ports`

Redis y MinIO son opcionales vía `COMPOSE_PROFILES`.
`logs` imprime primero el resumen del stack y `shell` abre una sesión interactiva dentro del contenedor indicado.
`<servicio>` puede ser cualquier nombre definido en los compose files del proyecto.

## Infraestructura

### `wodlie-engine infra:edit`

Estado: `implemented`

Edita la ficha técnica de infraestructura en `.wodlie-config/project.json` y regenera la documentación de `.infra/`.

### `wodlie-engine infra:sync`

Estado: `implemented`

Regenera la documentación de `.infra/` desde `.wodlie-config/project.json`.
No toca negocio ni código de `.dev/`.

## Negocio canónico

Estado: `implemented`

Comandos principales:

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
- `reconcile`

Regla: la IA no debe editar a mano `.wodlie-config/*.json`, `progress.*`, `state.json` ni eventos si existe un comando del engine para ese cambio.

## Otros comandos

| Comando | Estado | Nota |
|---|---|---|
| `ssh:verify` | `implemented` | valida SSH básico con la ficha del proyecto |
| `export` | `implemented` | genera artefactos de export |
| `purge` | `implemented` | remueve el engine del proyecto |
| `module:add` | `guided` | copia carpetas; no resuelve compatibilidad |
| `module:remove` | `guided` | flujo parcial |
| `deploy` | `guided` | imprime pasos; no despliega por sí mismo |
| `deliver` | `guided` | no cierra una entrega end-to-end |
| `reimport` | `planned` | no rehidrata un proyecto de cliente todavía |
| `upgrade` | `planned` | sin aplicación real del upgrade completo |
