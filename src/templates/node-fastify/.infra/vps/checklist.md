# Checklist VPS — {{PROJECT_NAME}}
> Ejecutar en orden. Cada paso es reversible.

---

## 1. Servidor base

- [ ] **Actualizar paquetes:** `sudo apt update && sudo apt upgrade -y`
- [ ] **Verificar proveedor / plan:** `{{INFRA_PROVIDER}}` / `{{INFRA_PLAN}}`
- [ ] **Confirmar capacidad real:** CPU `{{INFRA_CPU}}`, RAM `{{INFRA_RAM}}`, disco `{{INFRA_DISK}}`
- [ ] **Confirmar sistema operativo:** `{{INFRA_SERVER_OS}}`
- [ ] **Crear usuario deploy:** `sudo useradd -m -s /bin/bash deploy`
- [ ] **Agregar deploy al grupo docker:** `sudo usermod -aG docker deploy`
- [ ] **Configurar SSH para deploy:** copiar clave pública a `~deploy/.ssh/authorized_keys`
- [ ] **Verificar con `wodlie-engine ssh:verify`**

## 2. Dominio y DNS

- [ ] **Registro A:** `{{DOMAIN}}` → IP del servidor
- [ ] **Registro A:** `api.{{DOMAIN}}` → IP del servidor
- [ ] **Registro A:** `admin.{{DOMAIN}}` → IP del servidor
- [ ] **TTL:** reducir a 300s antes del deploy inicial
- [ ] **Verificar propagación:** `nslookup {{DOMAIN}}`

## 3. Estrategia de despliegue

- [ ] **Definir estructura de despliegue** para el proyecto
- [ ] **Definir servicios reales** a instalar en el servidor
- [ ] **Crear `.env.production`** con todas las variables
- [ ] **Documentar comando o proceso de arranque**

## 4. Variables de entorno

- [ ] **APP_SECRET:** generar con `openssl rand -base64 32`
- [ ] **JWT_SECRET:** generar con `openssl rand -base64 32`
- [ ] **JWT_REFRESH_SECRET:** generar con `openssl rand -base64 32`
- [ ] **DATABASE_URL:** con usuario y password seguros
- [ ] **Resto de variables:** completar desde `.env.example`
- [ ] **Verificar con `wodlie-engine env:sync`**

## 5. Primer deploy

- [ ] **Ejecutar el despliegue definido para este proyecto**
- [ ] **Verificar SSL y routing**
- [ ] **Healthcheck API:** `curl https://api.{{DOMAIN}}/health`
- [ ] **Abrir frontend:** `https://{{DOMAIN}}`
- [ ] **Abrir admin:** `https://admin.{{DOMAIN}}`

## 6. Post-deploy

- [ ] **Registrar en `wodlie-engine status`**
- [ ] **Commit:** `config(infra/vps): configuración inicial del servidor`
- [ ] **Notificar al equipo**
