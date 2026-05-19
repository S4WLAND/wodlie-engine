# Frontend Admin

Base runnable del panel interno con Next.js App Router.

> Para estándares transversales, ver `.dev/development_guidelines.md`.
> Para decisiones técnicas y deuda conocida, ver `CONTEXT_AI.md`.
> Para estado de avance e implementación, ver `PROGRESS_CHECKLIST.md`.

## Estructura física

```text
frontend-admin/
├── src/
│   ├── app/               auth, private area y páginas
│   ├── modules/<module>/  módulos administrativos
│   ├── shared/            API, hooks, realtime y stores
│   └── styles/            tokens y estilos globales
├── tests/
│   ├── unit/modules/
│   ├── e2e/modules/
│   └── non-functional/
├── next.config.mjs
├── playwright.config.ts
├── vitest.config.ts
├── Dockerfile
└── package.json
```

## Comandos

```bash
npm run dev
npm run build
npm run start
npm run test
npm run test:run
npm run test:e2e
npm run lint
```

## Variables de entorno

Ver `.env.example`. Claves principales:

- `NEXT_PUBLIC_EXTERNAL_API_URL`
- `INTERNAL_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_COOKIE_DOMAIN`
- `MEDIA_PUBLIC_URL`
- `NEXT_PUBLIC_REALTIME_ADAPTER`
- `NEXT_PUBLIC_REALTIME_URL`
- `NEXT_PUBLIC_POLLING_INTERVAL`

## Reglas

- la lógica administrativa vive en `modules/`
- `shared/hooks` y `shared/realtime` son infraestructura, no negocio
- `src/app/` orquesta auth, layout y vistas
