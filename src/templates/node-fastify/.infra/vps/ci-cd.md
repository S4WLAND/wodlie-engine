# CI/CD — VPS

## Flujo de deploy

```
push a dev → workflow deploy-staging.yml → VPS staging
push a main → workflow deploy-prod.yml → VPS producción (manual approval)
```

## Configuración SSH para CI/CD

### 1. Generar par de claves para el workflow

```bash
ssh-keygen -t ed25519 -C "ci-cd-{{PROJECT_NAME}}" -f ./deploy_key -N ""
```

### 2. Agregar clave pública al servidor

```bash
cat deploy_key.pub >> /home/deploy/.ssh/authorized_keys
```

### 3. Agregar clave privada como secret en el repositorio

Agregar `SSH_PRIVATE_KEY` como variable de entorno segura en el sistema CI/CD.

### 4. Variables requeridas en CI/CD

| Variable | Descripción |
|---|---|
| `SSH_HOST` | IP o dominio del VPS |
| `SSH_USER` | Usuario de deploy (deploy) |
| `SSH_PRIVATE_KEY` | Clave privada SSH |
| `SSH_PORT` | Puerto SSH (default 22) |

## Deploy manual de emergencia

```bash
ssh deploy@{{DOMAIN}}
cd /home/deploy/{{PROJECT_NAME}}
git pull origin main
docker compose pull
docker compose up -d --force-recreate
docker compose logs -f api
```

## Rollback manual

```bash
ssh deploy@{{DOMAIN}}
cd /home/deploy/{{PROJECT_NAME}}
git log --oneline -5           # ver commits recientes
git checkout <commit-anterior>
docker compose up -d --force-recreate
```
