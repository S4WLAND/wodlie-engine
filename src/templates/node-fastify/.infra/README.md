# Infraestructura — {{PROJECT_NAME}}

## Concepto

Esta capa gestiona toda la infraestructura del proyecto: VPS, hosting, cloud.
No contiene código ejecutable propio. Contiene documentación, templates y checklists accionables.

## Diagrama general

```
Internet
   │
   ▼
[Traefik] ← SSL + routing (80/443)
   │
   ├── api.{{DOMAIN}}       → backend-api (puerto 3000)
   ├── {{DOMAIN}}           → frontend-public (puerto 3001)
   └── admin.{{DOMAIN}}     → frontend-admin (puerto 3002)
              │
              ▼
         [PostgreSQL] (puerto 5432, solo red interna)
```

## Opciones de hosting

| Opción | Cuándo usar | Directorio |
|---|---|---|
| VPS | Proyectos con Docker y control total | `vps/` |
| Hosting compartido | Proyectos simples, sin Docker | `hosting/` |
| Cloud (AWS/GCP) | Proyectos enterprise con alta escala | `cloud/` |

## Entornos

```
development  → local con Docker Compose
staging      → VPS / cloud con rama dev
production   → VPS / cloud con rama main
```

## Flujo de deploy

```
git push dev → CI/CD → staging
git push main → CI/CD → production (con aprobación manual)
```
