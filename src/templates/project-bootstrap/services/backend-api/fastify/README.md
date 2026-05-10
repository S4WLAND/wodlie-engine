# Backend API

Base runnable del backend con Fastify + TypeScript + arquitectura modular.

> Para estándares transversales, ver `.dev/development_guidelines.md`.
> Para decisiones técnicas y deuda conocida, ver `CONTEXT_AI.md`.
> Para estado de avance e implementación, ver `PROGRESS_CHECKLIST.md`.

## Estructura física

```text
backend-api/
├── src/
│   ├── adapters/            cache y queue
│   ├── cli/                 comandos internos
│   ├── config/              app, env, media, security
│   ├── db/                  acceso a base de datos
│   ├── modules/<module>/    dominio, use-cases, infra y http
│   ├── plugins/             plugins globales de Fastify
│   ├── shared/              errores, logger, helpers y tipos
│   ├── workers/             jobs y procesos background
│   ├── app.ts               composición principal
│   └── server.ts            entrypoint
├── tests/
│   ├── unit/modules/<module>/
│   ├── integration/modules/<module>/
│   └── non-functional/
├── drizzle.config.ts
├── Dockerfile
└── package.json
```

## Comandos

```bash
npm run dev
npm run build
npm run start

npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio

npm run test
npm run test:run
npm run lint
```

## Variables de entorno

Ver `.env.example`. Claves principales:

- `NODE_ENV`
- `PORT`
- `HOST`
- `LOG_LEVEL`
- `JWT_SECRET`
- `DATABASE_URL`
- `QUEUE_ADAPTER`
- `CACHE_ADAPTER`
- `REDIS_URL`
- `MINIO_ENDPOINT`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `MINIO_BUCKET`
- `MINIO_PUBLIC_URL`
- `ALLOWED_ORIGINS`

## Patrón de módulo

Cada módulo sigue esta forma:

```text
modules/<name>/
  domain/
  use-cases/
  infra/
  http/
  composition.ts
  index.ts
```

Reglas:

- `use-cases/` es la frontera pública del módulo
- otro módulo no toca `infra/` ajena
- `shared/` contiene sólo utilidades técnicas
- `plugins/` contiene infraestructura HTTP/global

Ver `src/modules/_template/` como referencia.
