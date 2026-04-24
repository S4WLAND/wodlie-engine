# CI/CD — Cloud

## Flujo

```
push a dev → CI build → push image → deploy a staging
push a main → CI build → push image → deploy a producción (manual approval)
```

## Variables requeridas en CI/CD

| Variable | Descripción |
|---|---|
| `CLOUD_PROJECT_ID` | ID del proyecto cloud |
| `CLOUD_REGISTRY` | URL del container registry |
| `CLOUD_SERVICE_ACCOUNT_KEY` | Clave de service account (JSON) |
| `CLOUD_REGION` | Región de deploy |

## Comandos de deploy manual

### GCP Cloud Run

```bash
# Build y push
gcloud builds submit --tag gcr.io/PROJECT_ID/{{PROJECT_NAME}}-api

# Deploy
gcloud run deploy {{PROJECT_NAME}}-api \
  --image gcr.io/PROJECT_ID/{{PROJECT_NAME}}-api \
  --region us-central1 \
  --platform managed
```

### AWS ECS

```bash
# Push imagen
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/{{PROJECT_NAME}}-api:latest

# Update service
aws ecs update-service --cluster {{PROJECT_NAME}} --service api --force-new-deployment
```
