# @s4wland/wodlie-engine

CLI para proyectos greenfield con modelo canónico de negocio, eventos y artefactos derivados.

## Estado actual

- `init` compone proyectos desde un bootstrap híbrido por servicio
- `.wodlie-config/` gobierna negocio, arquitectura y eventos
- negocio, métricas y reportes semanales ya sincronizan desde la CLI
- `.infra/` ya trae Docker local `dev/test`, env sync, media local, workflows base y runbooks VPS
- no existe MCP en este repositorio
- `deploy`, `deliver`, `reimport` y `upgrade` siguen siendo flujos guiados o parciales

## Presets de `init`

Cada proyecto nuevo siempre incluye:

- `.business/`
- `.infra/`
- `.dev/`
- `.core/`
- `.github/`
- `.wodlie-config/`

Cada servicio se elige por separado:

| Servicio | Modos |
|---|---|
| `backend-api` | `neutral` o `fastify` |
| `frontend-public` | `neutral` o `nextjs` |
| `frontend-admin` | `neutral` o `nextjs` |

`neutral` deja estructura y documentación, pero no un runtime listo.

## Instalación local del engine

```bash
npm install
npm run build
npm run test:run
```

## Uso rápido

```bash
wodlie-engine init mi-proyecto
cd mi-proyecto
npm run env:sync
wodlie-engine status
```

Si elegiste `backend-api=fastify`, `frontend-public=nextjs` y `frontend-admin=nextjs`, también queda preconfigurado:

```bash
npm run dev:up
npm run test:up
npm run test:open
```

Si algún servicio quedó en `neutral`, esos comandos fallan temprano con un mensaje guiado hasta que completes o adaptes el stack real.

El stack runnable estándar separa `backend-api`, `frontend-public` y `frontend-admin`, sirve uploads por `media-nginx`, reserva rutas HTTP versionadas `/api/v1/{auth,admin,public,pages}` y deja workflows para test por servicio y promoción manual a producción.

## Shell interactiva

```bash
wodlie-engine
```

Menús principales:

- `Business`
- `Infra`
- `Reports`
- `Project`

## Documentación

| Documento | Descripción |
|---|---|
| [Getting Started](docs/getting-started.md) | flujo real de instalación y primer proyecto |
| [Comandos](docs/commands.md) | estado exacto de cada comando |
| [Templates](docs/templates.md) | bootstrap actual y presets por servicio |
| [Agentes](docs/agents.md) | cómo debe operar una IA con el engine |
| [Deploy](docs/deployment.md) | estado real de `deploy`, Docker local y promoción |
| [Current State](docs/current-state.md) | qué está implementado y qué sigue pendiente |
| [Philosophy](docs/philosophy.md) | visión general del framework |

## Regla de uso

Los artefactos estructurados que impactan estado, métricas o eventos no se escriben a mano.
La IA o el operador deben usar comandos del engine.

## Licencia

Privado — uso exclusivo de Wodlie y operadores autorizados.
