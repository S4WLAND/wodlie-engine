# {{PROJECT_NAME}}

> Proyecto gestionado con [@s4wland/wodlie-engine](https://github.com/S4WLAND/wodlie-engine)

## Capas

| Capa | Descripción |
|---|---|
| [.business/](.business/) | requerimientos, historias de usuario y reportes |
| [.infra/](.infra/) | Docker, envs, scripts operativos y runbooks |
| [.dev/](.dev/) | código fuente, tests y estándares técnicos |
| [.core/](.core/) | artefactos internos del engine |

## Composición inicial

| Servicio | Modo |
|---|---|
| `backend-api` | `{{BACKEND_API_MODE}}` |
| `frontend-public` | `{{FRONTEND_PUBLIC_MODE}}` |
| `frontend-admin` | `{{FRONTEND_ADMIN_MODE}}` |

## Punto de entrada para IA

Leer `AGENTS.md` y luego `.core/AGENTS.md` para el árbol de lectura completo por tipo de tarea.

## Comandos rápidos

```bash
wodlie-engine status
wodlie-engine health
wodlie-engine report:draft

npm run env:sync
npm run infra:status
npm run infra:ports
```

Si los tres servicios están en modo runnable (`fastify + nextjs + nextjs`), también quedan listos:

```bash
npm run dev:up
npm run test:up
npm run test:expose
npm run dev:shell backend-api
```

Cuando un servicio sigue en `neutral`, esos comandos existen como contrato operativo pero requieren completar o adaptar el stack real antes de levantarlo.

## Nota de estructura

- `.github/` vive en la raíz porque GitHub Actions sólo reconoce workflows ahí.
- `.infra/` concentra Docker, scripts `env/ci`, catálogos de variables y runbooks operativos.
- `.dev/development_guidelines.md` define la arquitectura y estándares generales del código.
- `npm run env:sync` crea estos archivos locales por servicio:
  - `.dev/src/backend-api/.env.development`
  - `.dev/src/backend-api/.env.test`
  - `.dev/src/frontend-public/.env.development`
  - `.dev/src/frontend-public/.env.test`
  - `.dev/src/frontend-admin/.env.development`
  - `.dev/src/frontend-admin/.env.test`

## Operador

{{OPERATOR}} — iniciado el {{DATE}}
