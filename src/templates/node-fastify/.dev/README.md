# Dev — {{PROJECT_NAME}}

## Stack

- **Backend:** Node.js 20 + Fastify + TypeScript + Drizzle ORM + PostgreSQL
- **Frontend público:** Next.js 14 (App Router) + TypeScript + Zustand + React Query
- **Frontend admin:** Next.js 14 (App Router) + TypeScript + Zustand + React Query
- **Tests:** Vitest (unit/integration) + Playwright (E2E)
- **Estilos:** CSS puro con `tokens.css`

## Cómo arrancar localmente

### Prerrequisitos
- Node.js 20+
- Docker + Docker Compose (para PostgreSQL local)
- pnpm o npm

### Setup inicial

```bash
# 1. Levantar base de datos local
docker compose -f .infra/vps/docker-compose/base.yml up postgres -d

# 2. Instalar dependencias de cada app
cd .dev/src/backend-api && npm install
cd .dev/src/frontend-public && npm install
cd .dev/src/frontend-admin && npm install

# 3. Configurar variables de entorno
cp .dev/src/backend-api/.env.example .dev/src/backend-api/.env.development
# Editar con valores locales

# 4. Ejecutar migraciones
cd .dev/src/backend-api
npm run db:push

# 5. Iniciar servicios en modo desarrollo
npm run dev  # en cada carpeta, terminales separadas
```

### Puertos locales

| Servicio | Puerto |
|---|---|
| backend-api | 3000 |
| frontend-public | 3001 |
| frontend-admin | 3002 |
| postgres | 5432 |

## Arquitectura

Ver `GUIDELINES.md` para decisiones técnicas y patrones.
Ver `src/<app>/src/modules/_template/` para el patrón de módulo.
