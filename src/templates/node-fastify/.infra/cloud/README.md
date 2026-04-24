# Cloud — {{PROJECT_NAME}}

## Cuándo usar cloud

- Proyectos enterprise con alta escala
- Necesidad de auto-scaling
- Multi-región o alta disponibilidad
- Equipo con experiencia en cloud

## Proveedores soportados

| Proveedor | Cuándo usar |
|---|---|
| AWS | Ecosistema completo, enterprise |
| GCP | IA/ML intensivo, analytics |
| Azure | Empresas con Microsoft stack |

## Stack cloud recomendado

```
Cloud Run / ECS    → containers serverless
Cloud SQL / RDS    → Postgres managed
Cloud Storage / S3 → archivos y media
Cloud CDN          → assets estáticos
Secret Manager     → variables sensibles
```

## Diferencias vs VPS

- Sin gestión de servidor → más DX, menos control
- Auto-scaling automático → más caro en picos
- Secrets en cloud secretmanager → no en archivos .env
- CI/CD via cloud build o equivalente

## Archivos importantes

- `checklist.md` — pasos de configuración
- `secrets.md` — gestión con cloud secretmanager
- `ci-cd.md` — pipelines cloud nativos
