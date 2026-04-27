# VPS — {{PROJECT_NAME}}

## Concepto

Infraestructura VPS documentada y operada manualmente por ahora.
Esta capa deja una ficha técnica del servidor y un runbook base de despliegue.

## Ficha del servidor

| Campo | Valor |
|---|---|
| Proveedor | {{INFRA_PROVIDER}} |
| Plan | {{INFRA_PLAN}} |
| Región | {{INFRA_REGION}} |
| Sistema operativo | {{INFRA_SERVER_OS}} |
| CPU | {{INFRA_CPU}} |
| RAM | {{INFRA_RAM}} |
| Disco | {{INFRA_DISK}} |
| SSH host | {{INFRA_SSH_HOST}} |
| SSH user | {{INFRA_SSH_USER}} |

## Prerrequisitos

- VPS accesible por SSH
- Dominio apuntando al IP del servidor
- Variables críticas identificadas
- Estrategia de despliegue definida

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

## Notas operativas

{{INFRA_NOTES}}
