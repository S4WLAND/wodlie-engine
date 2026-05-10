# Dev — {{PROJECT_NAME}}

## Composición inicial

- **backend-api:** `{{BACKEND_API_MODE}}`
- **frontend-public:** `{{FRONTEND_PUBLIC_MODE}}`
- **frontend-admin:** `{{FRONTEND_ADMIN_MODE}}`

## Cómo arrancar localmente

### Prerrequisitos

- Node.js 20+
- Docker + Docker Compose
- npm

### Bootstrap inicial

```bash
# 1. Materializar archivos locales desde templates versionados
npm run env:sync

# 2. Revisar y ajustar si hace falta:
#    - .infra/env/stack.dev.env
#    - .infra/env/stack.test.env
#    - .infra/env/test-expose.env
```

Si los tres servicios usan presets runnable (`fastify + nextjs + nextjs`):

```bash
npm run dev:up
# o
npm run test:up
```

Si alguno sigue en `neutral`, el proyecto ya trae la estructura y la documentación, pero el stack Docker local debe completarse o adaptarse a la tecnología real antes de levantarlo.

## Superficie operativa

```bash
# Variables y catálogos
npm run env:sync
npm run env:check

# Stacks locales
npm run dev:up
npm run dev:logs
npm run dev:shell <servicio>
npm run dev:restart
npm run dev:down

npm run test:up
npm run test:logs
npm run test:shell <servicio>
npm run test:expose
npm run test:close
npm run test:down

# Estado general
npm run infra:status
npm run infra:ports
```

### Puertos locales por entorno

| Servicio | `dev` | `test` |
|---|---:|---:|
| backend-api | 3000 | 3100 |
| frontend-public | 3001 | 3101 |
| frontend-admin | 3002 | 3102 |
| postgres | 5432 | 55432 |
| redis | 6379 | 16379 |
| minio api | 9000 | 9100 |
| minio console | 9001 | 9101 |

Redis y MinIO están desactivados por defecto. Se activan con `COMPOSE_PROFILES=redis`, `COMPOSE_PROFILES=minio` o `COMPOSE_PROFILES=redis,minio`.

`<servicio>` acepta cualquier nombre definido en los compose files, por ejemplo `backend-api`, `frontend-public`, `frontend-admin`, `postgres`, `redis`, `minio`.

## Flujo de `.env`

- `npm run env:sync` lee los `.env.example` de cada servicio para conocer las claves requeridas
- `npm run env:sync` crea o completa:
  - `.dev/src/backend-api/.env.development`
  - `.dev/src/backend-api/.env.test`
  - `.dev/src/frontend-public/.env.development`
  - `.dev/src/frontend-public/.env.test`
  - `.dev/src/frontend-admin/.env.development`
  - `.dev/src/frontend-admin/.env.test`
- Los valores compartidos del stack salen de:
  - `.infra/env/stack.dev.env`
  - `.infra/env/stack.test.env`
- La exposición pública de `test` se configura aparte en:
  - `.infra/env/test-expose.env`
- `catalog.json` sólo se reescribe cuando cambia el contrato de claves de algún servicio, evitando ruido innecesario en git

## UX operativa

- `npm run dev:logs` y `npm run test:logs` muestran primero el resumen del stack y después siguen el stream
- `npm run dev:shell <servicio>` y `npm run test:shell <servicio>` abren shell dentro del contenedor indicado
- la salida del stack usa colores por servicio para acelerar lectura y diagnóstico

## Arquitectura

Ver `.dev/development_guidelines.md` para decisiones técnicas y patrones.  
Ver `src/<service>/README.md` y `src/<service>/CONTEXT_AI.md` para detalles de cada servicio.
