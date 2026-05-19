# Templates

## Estado actual

El engine ya no usa un único template cerrado.

Hoy `init` compone un bootstrap llamado `project-bootstrap` con:

- una raíz común
- presets por servicio
- reemplazo de variables
- escritura final en `.wodlie-config/project.json`

## Presets disponibles

| Servicio | Presets |
|---|---|
| `backend-api` | `neutral`, `fastify` |
| `frontend-public` | `neutral`, `nextjs` |
| `frontend-admin` | `neutral`, `nextjs` |

## Cómo funciona `init`

```text
wodlie-engine init mi-proyecto
    ↓
1. Copia dist/templates/project-bootstrap/root/ → mi-proyecto/
2. Pregunta por metadatos, infra y modo de cada servicio
3. Copia el preset elegido a .dev/src/<service>/
4. Ajusta .wodlie-config/project.json con datos reales y service_modes
5. Inicializa business.json, architecture.json y events.jsonl
6. Regenera .infra/ documental desde project.json
7. Inicializa git con primer commit
```

## Variables disponibles en templates

| Variable | Descripción |
|---|---|
| `{{PROJECT_NAME}}` | nombre/slug del proyecto |
| `{{CLIENT_NAME}}` | nombre visible del cliente |
| `{{PROJECT_TYPE}}` | `webapp`, `platform`, `enterprise`, `iot` |
| `{{PROJECT_SIZE}}` | `small`, `medium`, `large` |
| `{{PROJECT_STACK}}` | metadata base (`node`, `python`, `go`) |
| `{{DATE}}` | fecha de creación |
| `{{OPERATOR}}` | operador que inicializa |
| `{{CONTRACT_TYPE}}` | `fixed` o `subscription` |
| `{{INFRA_TYPE}}` | `vps`, `hosting`, `cloud` |
| `{{INFRA_PROVIDER}}` | proveedor registrado |
| `{{INFRA_PLAN}}` | plan o producto |
| `{{INFRA_REGION}}` | región/datacenter |
| `{{INFRA_SERVER_OS}}` | sistema operativo |
| `{{INFRA_CPU}}` | CPU / vCores |
| `{{INFRA_RAM}}` | RAM |
| `{{INFRA_DISK}}` | disco |
| `{{INFRA_SSH_HOST}}` | host SSH |
| `{{INFRA_SSH_USER}}` | usuario SSH |
| `{{INFRA_NOTES}}` | notas de infraestructura |
| `{{DOMAIN}}` | dominio principal |
| `{{EMAIL}}` | email para SSL |
| `{{BACKEND_API_MODE}}` | `neutral` o `fastify` |
| `{{FRONTEND_PUBLIC_MODE}}` | `neutral` o `nextjs` |
| `{{FRONTEND_ADMIN_MODE}}` | `neutral` o `nextjs` |
| `{{BACKEND_STACK}}` | descripción del stack backend para guidelines |
| `{{ORM_STACK}}` | ORM o acceso a datos recomendado |
| `{{DB_STACK}}` | base de datos objetivo |
| `{{FRONTEND_STACK}}` | stack frontend recomendado |
| `{{STATE_MANAGEMENT}}` | manejo de estado cliente |
| `{{DATA_FETCHING}}` | estrategia de datos remotos |
| `{{STYLES_APPROACH}}` | estrategia CSS/UI |
| `{{UNIT_TEST_FRAMEWORK}}` | framework de tests unitarios |
| `{{E2E_TEST_FRAMEWORK}}` | framework E2E |
| `{{QUEUE_STACK}}` | cola de trabajos |
| `{{CACHE_STACK}}` | cache |
| `{{HTTP_CLIENT}}` | cliente HTTP |
| `{{LOGGER}}` | logger |
| `{{VALIDATION_LIBRARY}}` | validación de schemas |

## Qué entrega hoy

- estructura de 4 capas + `.github/`
- `AGENTS.md` desde raíz hasta cada servicio
- `development_guidelines.md` general
- `.infra/` con Docker `dev/test`, env sync, media local, expose temporal y runbooks
- `.github/workflows/` con test por servicio, cleanup de runner y promoción manual granular a producción
- `backend-api` con superficies `/api/v1/auth`, `/api/v1/admin`, `/api/v1/public` y `page-modules` para BFF SSR
- servicios `neutral` documentados
- presets runnable `fastify` y `nextjs` sobre Node 20, Next 16 y React 19

## Qué no entrega hoy

- composición posterior al `init` por comando dedicado
- soporte runnable para stacks distintos de `fastify/nextjs`
- CI/CD operativa sin completar secrets, vars y apps remotas reales
- reconciliación automática profunda si cambias la composición después de crear el proyecto
