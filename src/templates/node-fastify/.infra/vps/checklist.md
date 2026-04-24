# Checklist VPS — {{PROJECT_NAME}}
> Ejecutar en orden. Cada paso es reversible.

---

## 1. Servidor base

- [ ] **Actualizar paquetes:** `sudo apt update && sudo apt upgrade -y`
- [ ] **Instalar Docker:** seguir guía oficial para Ubuntu 22.04
- [ ] **Instalar Docker Compose:** `sudo apt install docker-compose-plugin`
- [ ] **Crear usuario deploy:** `sudo useradd -m -s /bin/bash deploy`
- [ ] **Agregar deploy al grupo docker:** `sudo usermod -aG docker deploy`
- [ ] **Configurar SSH para deploy:** copiar clave pública a `~deploy/.ssh/authorized_keys`
- [ ] **Verificar con `wodlie ssh:verify`**

## 2. Dominio y DNS

- [ ] **Registro A:** `{{DOMAIN}}` → IP del servidor
- [ ] **Registro A:** `api.{{DOMAIN}}` → IP del servidor
- [ ] **Registro A:** `admin.{{DOMAIN}}` → IP del servidor
- [ ] **TTL:** reducir a 300s antes del deploy inicial
- [ ] **Verificar propagación:** `nslookup {{DOMAIN}}`

## 3. Docker Compose

- [ ] **Copiar base.yml:** al directorio `/home/deploy/{{PROJECT_NAME}}/`
- [ ] **Seleccionar perfil:** webapp | platform | enterprise
- [ ] **Seleccionar tamaño:** small | medium | large
- [ ] **Activar capabilities:** según brief (ai, realtime, media, etc)
- [ ] **Crear `.env.production`** con todas las variables

## 4. Variables de entorno

- [ ] **APP_SECRET:** generar con `openssl rand -base64 32`
- [ ] **JWT_SECRET:** generar con `openssl rand -base64 32`
- [ ] **JWT_REFRESH_SECRET:** generar con `openssl rand -base64 32`
- [ ] **DATABASE_URL:** con usuario y password seguros
- [ ] **Resto de variables:** completar desde `.env.example`
- [ ] **Verificar con `wodlie env:sync`**

## 5. Primer deploy

- [ ] **`docker compose up -d`**
- [ ] **Verificar SSL:** Traefik genera automáticamente con Let's Encrypt
- [ ] **Healthcheck API:** `curl https://api.{{DOMAIN}}/health`
- [ ] **Abrir frontend:** `https://{{DOMAIN}}`
- [ ] **Abrir admin:** `https://admin.{{DOMAIN}}`

## 6. Post-deploy

- [ ] **Registrar en `wodlie status`**
- [ ] **Commit:** `config(infra/vps): configuración inicial del servidor`
- [ ] **Notificar al equipo**
