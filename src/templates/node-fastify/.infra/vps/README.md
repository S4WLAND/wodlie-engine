# VPS — {{PROJECT_NAME}}

## Concepto

Despliegue con Docker Compose sobre VPS propio o alquilado.
Stack: Traefik (proxy reverso + SSL) + Postgres + API + Frontends.

## Prerrequisitos

- VPS con Ubuntu 22.04 LTS mínimo
- 2 vCPU / 2GB RAM (small), 4 vCPU / 4GB RAM (medium)
- Docker + Docker Compose instalados
- Dominio apuntando al IP del servidor
- Acceso SSH configurado

## Diagrama de arquitectura

```
[Cliente] ──HTTPS──► [Traefik :443]
                          │
              ┌───────────┼───────────┐
              │           │           │
         [API :3000]  [Public :3001]  [Admin :3002]
              │
         [Postgres :5432]
         [Redis :6379]  (opcional)
         [MinIO :9000]  (opcional)
```

## Subdominios estándar Wodlie

```
api.{{DOMAIN}}       → backend-api
{{DOMAIN}}           → frontend-public
admin.{{DOMAIN}}     → frontend-admin
db.{{DOMAIN}}        → Adminer (solo staging)
storage.{{DOMAIN}}   → MinIO (si está activo)
```

## Archivos importantes

- `checklist.md` — pasos de configuración
- `secrets.md` — gestión de variables de entorno
- `ci-cd.md` — configuración de deploy automático
- `docker-compose/` — templates de compose
