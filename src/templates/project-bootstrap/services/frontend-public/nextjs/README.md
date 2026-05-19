# Frontend Public

Base runnable del sitio público con Next.js App Router.

> Para estándares transversales, ver `.dev/development_guidelines.md`.
> Para decisiones técnicas y deuda conocida, ver `CONTEXT_AI.md`.
> Para estado de avance e implementación, ver `PROGRESS_CHECKLIST.md`.

## Estructura física

```text
frontend-public/
├── src/
│   ├── app/               layout, páginas y handlers de metadata
│   ├── modules/<module>/  módulos de negocio
│   ├── shared/            API client, stores y utilidades UI
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
- `NEXT_PUBLIC_COOKIE_DOMAIN`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `MEDIA_PUBLIC_URL`

## Reglas

- la lógica de producto vive en `modules/`
- `src/app/` debe mantenerse delgado
- `shared/` contiene infraestructura reutilizable, no reglas de negocio
- `tokens.css` es la base visual común
