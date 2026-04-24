# Gestión de Secretos — VPS

## Principio

**Nunca commitear secrets.** Las variables sensibles viven en:
- `.env.development` → local (en `.gitignore`)
- `.env.production` → VPS (en `.gitignore`)
- `.env.example` → versionado, con placeholders vacíos

## Flujo de env promotion

```
.env.example (versionado, vacío)
    │
    ▼
.env.development (local, no versionado)
    │  wodlie env:sync
    ▼
.env.production (VPS, no versionado)
```

## Generar secrets seguros

```bash
# APP_SECRET, JWT_SECRET, JWT_REFRESH_SECRET
openssl rand -base64 32

# DB password
openssl rand -hex 16

# APP_SECRET alternativo
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Variables críticas

| Variable | Descripción | Cómo generar |
|---|---|---|
| `APP_SECRET` | Firma de sesiones | `openssl rand -base64 32` |
| `JWT_SECRET` | Firma de tokens | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Firma refresh tokens | `openssl rand -base64 32` |
| `DB_PASSWORD` | Password de Postgres | `openssl rand -hex 16` |
| `MINIO_ROOT_PASSWORD` | Password de MinIO | `openssl rand -hex 16` |

## Rotación de secrets

1. Generar nuevo valor
2. Actualizar `.env.production` en el VPS
3. `docker compose restart api`
4. Verificar healthcheck
5. Documentar en `changelog.md` con tipo `CORRECCIÓN`

## Variables que NO son secretas

Estas pueden aparecer en `.env.example` con valores reales:
- `NODE_ENV`, `PORT`, `HOST`
- `SMTP_PORT`, `JWT_EXPIRES_IN`
- `NEXT_PUBLIC_*` (son públicas por definición)
