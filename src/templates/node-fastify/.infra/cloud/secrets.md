# Gestión de Secretos — Cloud

## Principio

En cloud, los secretos NO van en archivos `.env` — van en el Secret Manager del proveedor.

## AWS Secrets Manager

```bash
# Crear secret
aws secretsmanager create-secret \
  --name "{{PROJECT_NAME}}/production/JWT_SECRET" \
  --secret-string "$(openssl rand -base64 32)"

# Leer desde código
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"
```

## GCP Secret Manager

```bash
# Crear secret
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create JWT_SECRET --data-file=-

# Leer desde código
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager')
```

## Variables de entorno en el servicio

Referenciar secrets en las variables de entorno del contenedor:
- AWS: `arn:aws:secretsmanager:...`
- GCP: `projects/PROJECT_ID/secrets/SECRET_NAME/versions/latest`
