# CI/CD — Hosting

## Flujo básico

```
push a main → workflow deploy-prod.yml → deploy via FTP/SSH
```

## Variables requeridas en CI/CD

| Variable | Descripción |
|---|---|
| `FTP_HOST` | Host del servidor FTP |
| `FTP_USER` | Usuario FTP |
| `FTP_PASSWORD` | Password FTP |
| `SSH_HOST` | IP del servidor (si tiene SSH) |
| `SSH_USER` | Usuario SSH |
| `SSH_PRIVATE_KEY` | Clave privada SSH |

## Deploy manual

```bash
# Via FTP
ftp {{DOMAIN}}

# Via SSH (si disponible)
ssh usuario@{{DOMAIN}}
cd public_html
git pull origin main
npm install --production
pm2 restart all
```
