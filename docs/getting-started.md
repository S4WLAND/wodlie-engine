# Getting Started

## Prerrequisitos

- Node.js >= 20
- Git
- npm

## 1. Preparar el engine

```bash
git clone <repo>
cd wodlie-engine
npm install
npm run build
npm run test:run
npm link
```

## 2. Crear un proyecto

```bash
wodlie-engine init mi-proyecto
```

`init` pregunta por:

- tipo de proyecto
- tamaño
- stack base (`node|python|go`) como metadata de compatibilidad
- infraestructura objetivo
- cliente, operador, dominio y email
- tipo de contrato
- capabilities
- modo de cada servicio

Modos disponibles:

- `backend-api`: `neutral` o `fastify`
- `frontend-public`: `neutral` o `nextjs`
- `frontend-admin`: `neutral` o `nextjs`

## 3. Estructura generada

```text
mi-proyecto/
├── .business/
├── .infra/
├── .core/
├── .dev/
│   └── src/
│       ├── backend-api/
│       ├── frontend-public/
│       └── frontend-admin/
├── .github/
├── .wodlie-config/
├── .gitignore
├── .env.example
└── README.md
```

## 4. Materializar envs locales

```bash
cd mi-proyecto
npm run env:sync
```

Esto crea o completa:

- `.dev/src/backend-api/.env.development`
- `.dev/src/backend-api/.env.test`
- `.dev/src/frontend-public/.env.development`
- `.dev/src/frontend-public/.env.test`
- `.dev/src/frontend-admin/.env.development`
- `.dev/src/frontend-admin/.env.test`
- `.infra/env/stack.dev.env`
- `.infra/env/stack.test.env`
- `.infra/env/test-expose.env`
- `.infra/env/catalog.json`

También deja preparados `.dev/storage/dev/uploads` y `.dev/storage/test/uploads` para media local servida por `media-nginx`.

## 5. Levantar el stack local

Si elegiste la combinación runnable:

```bash
npm run dev:up
# o
npm run test:up
```

Para publicar temporalmente el stack `test` con URLs públicas configuradas en `.infra/env/test-expose.env`:

```bash
npm run test:open
npm run test:close
```

Si dejaste algún servicio en `neutral`, el proyecto queda documentado pero no runnable todavía. En ese caso:

- completar el servicio manualmente
- o adaptar `.infra/docker/*` y `.infra/env/*` al stack real

## 6. Operar negocio y reportes

```bash
wodlie-engine
wodlie-engine business:sync
wodlie-engine status
wodlie-engine health
wodlie-engine report:draft
```

## Límites actuales

- no existe MCP
- `deploy` sigue siendo guiado
- los workflows de `.github/workflows/` requieren secrets/vars reales antes de operar
- `deliver`, `reimport` y `upgrade` no cierran un flujo end-to-end todavía

## Siguiente lectura

- [Comandos](commands.md)
- [Templates](templates.md)
- [Agentes](agents.md)
- [Current State](current-state.md)
