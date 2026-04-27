import chalk from 'chalk'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import path from 'path'
import { appendLayerChangelog } from './shared/changelog'
import { loadProjectConfig, type ProjectConfig } from './shared/config'

interface InfraPromptAnswers {
  provider: string
  plan: string
  region: string
  server_os: string
  cpu: string
  ram: string
  disk: string
  ssh_host: string
  ssh_user: string
  notes: string
}

function getOperatorName(): string {
  return process.env.GIT_AUTHOR_NAME
    || process.env.GIT_COMMITTER_NAME
    || process.env.USERNAME
    || process.env.USER
    || 'operador'
}

function infraDetails(config: ProjectConfig): Required<NonNullable<ProjectConfig['infra_details']>> {
  return {
    provider: config.infra_details?.provider ?? '',
    plan: config.infra_details?.plan ?? '',
    region: config.infra_details?.region ?? '',
    server_os: config.infra_details?.server_os ?? '',
    cpu: config.infra_details?.cpu ?? '',
    ram: config.infra_details?.ram ?? '',
    disk: config.infra_details?.disk ?? '',
    ssh_host: config.infra_details?.ssh_host ?? '',
    ssh_user: config.infra_details?.ssh_user ?? '',
    notes: config.infra_details?.notes ?? '',
  }
}

function renderInfraReadme(config: ProjectConfig): string {
  return `# Infraestructura — ${config.project}

## Concepto

Esta capa gestiona la infraestructura del proyecto como documentación operativa.
No define despliegue automático. Su función es mantener una ficha técnica clara y trazable.

## Opción activa

- Tipo de infraestructura: \`${config.hosting_type}\`
- Perfil del proyecto: \`${config.project_profile.type}\`
- Tamaño del proyecto: \`${config.project_profile.size}\`

## Entornos de referencia

\`\`\`
development  → local
staging      → infraestructura remota con rama dev
production   → infraestructura remota con rama main
\`\`\`

## Directorios

| Directorio | Uso |
|---|---|
| \`${config.hosting_type}/\` | Documentación operativa de la infraestructura elegida |

## Regla de operación

- La ficha técnica vive en \`.wodlie-config/project.json\`
- La documentación de \`.infra/\` se puede regenerar con \`wodlie-engine infra:sync\`
- Si cambias proveedor, recursos o acceso SSH, primero actualiza la ficha con \`wodlie-engine infra:edit\`
`
}

function renderVpsReadme(config: ProjectConfig): string {
  const details = infraDetails(config)

  return `# VPS — ${config.project}

## Concepto

Infraestructura VPS documentada y operada manualmente por ahora.
Esta capa deja una ficha técnica del servidor y un runbook base de despliegue.

## Ficha del servidor

| Campo | Valor |
|---|---|
| Proveedor | ${details.provider || 'pendiente'} |
| Plan | ${details.plan || 'pendiente'} |
| Región | ${details.region || 'pendiente'} |
| Sistema operativo | ${details.server_os || 'pendiente'} |
| CPU | ${details.cpu || 'pendiente'} |
| RAM | ${details.ram || 'pendiente'} |
| Disco | ${details.disk || 'pendiente'} |
| SSH host | ${details.ssh_host || 'pendiente'} |
| SSH user | ${details.ssh_user || 'pendiente'} |

## Prerrequisitos

- VPS accesible por SSH
- Dominio apuntando al IP del servidor
- Variables críticas identificadas
- Estrategia de despliegue definida

## Diagrama de arquitectura

\`\`\`
[Cliente] ──HTTPS──► [Reverse proxy / entrypoint]
                          │
              ┌───────────┼───────────┐
              │           │           │
         [API]        [Public]     [Admin]
              │
        [Base de datos]
\`\`\`

## Subdominios estándar Wodlie

\`\`\`
api.${config.project}.dominio       → backend-api
[dominio principal]                 → frontend-public
admin.[dominio principal]           → frontend-admin
\`\`\`

## Archivos importantes

- \`checklist.md\` — pasos de configuración
- \`secrets.md\` — gestión de variables de entorno
- \`ci-cd.md\` — configuración de deploy automático

## Notas operativas

${details.notes || 'Sin notas registradas.'}
`
}

function renderVpsChecklist(config: ProjectConfig): string {
  const details = infraDetails(config)

  return `# Checklist VPS — ${config.project}
> Ejecutar en orden. Cada paso es reversible.

---

## 1. Servidor base

- [ ] **Actualizar paquetes:** \`sudo apt update && sudo apt upgrade -y\`
- [ ] **Verificar proveedor / plan:** \`${details.provider || 'pendiente'}\` / \`${details.plan || 'pendiente'}\`
- [ ] **Confirmar capacidad real:** CPU \`${details.cpu || 'pendiente'}\`, RAM \`${details.ram || 'pendiente'}\`, disco \`${details.disk || 'pendiente'}\`
- [ ] **Confirmar sistema operativo:** \`${details.server_os || 'pendiente'}\`
- [ ] **Crear usuario deploy:** \`sudo useradd -m -s /bin/bash deploy\`
- [ ] **Configurar SSH para deploy**
- [ ] **Verificar con \`wodlie-engine ssh:verify\`**

## 2. Dominio y DNS

- [ ] **Registro A:** dominio principal → IP del servidor
- [ ] **Registro A:** subdominio API → IP del servidor
- [ ] **Registro A:** subdominio admin → IP del servidor
- [ ] **Verificar propagación**

## 3. Estrategia de despliegue

- [ ] **Definir estructura de despliegue** para el proyecto
- [ ] **Definir servicios reales** a instalar en el servidor
- [ ] **Crear \`.env.production\`** con todas las variables
- [ ] **Documentar comando o proceso de arranque**

## 4. Variables de entorno

- [ ] **APP_SECRET:** generar con \`openssl rand -base64 32\`
- [ ] **JWT_SECRET:** generar con \`openssl rand -base64 32\`
- [ ] **JWT_REFRESH_SECRET:** generar con \`openssl rand -base64 32\`
- [ ] **DATABASE_URL:** con usuario y password seguros
- [ ] **Resto de variables:** completar desde \`.env.example\`
- [ ] **Verificar con \`wodlie-engine env:sync\`**

## 5. Primer deploy

- [ ] **Ejecutar el despliegue definido para este proyecto**
- [ ] **Verificar SSL y routing**
- [ ] **Healthcheck API**
- [ ] **Abrir frontend**
- [ ] **Abrir admin**

## 6. Post-deploy

- [ ] **Registrar en \`wodlie-engine status\`**
- [ ] **Commit:** \`config(infra/vps): configuración inicial del servidor\`
- [ ] **Notificar al equipo**
`
}

function renderVpsSecrets(config: ProjectConfig): string {
  const details = infraDetails(config)

  return `# Gestión de Secretos — VPS

## Ficha operativa

- SSH host: \`${details.ssh_host || 'pendiente'}\`
- SSH user: \`${details.ssh_user || 'pendiente'}\`

## Principio

**Nunca commitear secrets.** Las variables sensibles viven en:
- \`.env.development\` → local (en \`.gitignore\`)
- \`.env.production\` → servidor / VPS (en \`.gitignore\`)
- \`.env.example\` → versionado, con placeholders vacíos

## Flujo de env promotion

\`\`\`
.env.example (versionado, vacío)
    │
    ▼
.env.development (local, no versionado)
    │  wodlie-engine env:sync
    ▼
.env.production (servidor, no versionado)
\`\`\`

## Generar secrets seguros

\`\`\`bash
openssl rand -base64 32
openssl rand -hex 16
\`\`\`

## Variables críticas

| Variable | Descripción |
|---|---|
| \`APP_SECRET\` | Firma de sesiones |
| \`JWT_SECRET\` | Firma de tokens |
| \`JWT_REFRESH_SECRET\` | Firma refresh tokens |
| \`DB_PASSWORD\` | Password de Postgres |
| \`MINIO_ROOT_PASSWORD\` | Password de MinIO |

## Rotación de secrets

1. Generar nuevo valor
2. Actualizar \`.env.production\` en el servidor
3. Reiniciar el proceso correspondiente
4. Verificar healthcheck
5. Documentar en \`.infra/changelog.md\`
`
}

function renderVpsCiCd(config: ProjectConfig): string {
  const details = infraDetails(config)

  return `# CI/CD — VPS

## Flujo de deploy

\`\`\`
push a dev → workflow deploy-staging.yml → staging
push a main → workflow deploy-prod.yml → producción
\`\`\`

## Configuración SSH para CI/CD

| Variable | Valor actual |
|---|---|
| \`SSH_HOST\` | ${details.ssh_host || 'pendiente'} |
| \`SSH_USER\` | ${details.ssh_user || 'deploy'} |
| \`SSH_PORT\` | 22 |

## Deploy manual de emergencia

\`\`\`bash
ssh ${details.ssh_user || 'deploy'}@${details.ssh_host || '<host>'}
cd /home/deploy/${config.project}
# ejecutar aquí el proceso real definido para este proyecto
\`\`\`

## Rollback manual

\`\`\`bash
ssh ${details.ssh_user || 'deploy'}@${details.ssh_host || '<host>'}
cd /home/deploy/${config.project}
git log --oneline -5
git checkout <commit-anterior>
# reejecutar aquí el proceso real definido para este proyecto
\`\`\`
`
}

async function writeInfraFiles(config: ProjectConfig): Promise<void> {
  const infraDir = path.join(process.cwd(), '.infra')
  await fs.ensureDir(infraDir)
  await fs.writeFile(path.join(infraDir, 'README.md'), renderInfraReadme(config), 'utf-8')

  if (config.hosting_type === 'vps') {
    const vpsDir = path.join(infraDir, 'vps')
    await fs.ensureDir(vpsDir)
    await fs.writeFile(path.join(vpsDir, 'README.md'), renderVpsReadme(config), 'utf-8')
    await fs.writeFile(path.join(vpsDir, 'checklist.md'), renderVpsChecklist(config), 'utf-8')
    await fs.writeFile(path.join(vpsDir, 'secrets.md'), renderVpsSecrets(config), 'utf-8')
    await fs.writeFile(path.join(vpsDir, 'ci-cd.md'), renderVpsCiCd(config), 'utf-8')
  }
}

async function saveProjectConfig(config: ProjectConfig): Promise<void> {
  const configPath = path.join(process.cwd(), '.wodlie-config', 'project.json')
  await fs.writeJson(configPath, config, { spaces: 2 })
}

async function logInfraChange(description: string, impact: string[]): Promise<void> {
  await appendLayerChangelog({
    date: new Date().toISOString().split('T')[0],
    layer: 'infra',
    type: 'CAMBIO',
    description,
    operator: getOperatorName(),
    impact,
    stories_affected: [],
  })
}

export async function infraSyncArtifacts(config?: ProjectConfig): Promise<void> {
  const resolvedConfig = config ?? await loadProjectConfig()
  await writeInfraFiles(resolvedConfig)
}

export async function infraSyncCommand(): Promise<void> {
  console.log(chalk.bold('\nInfra Sync — Regenerando documentación de infraestructura\n'))
  const config = await loadProjectConfig()
  await infraSyncArtifacts(config)
  await logInfraChange(`Documentación de infra ${config.hosting_type} regenerada desde project.json`, [config.hosting_type])
  console.log(chalk.green(`✓ Documentación de infra regenerada para ${config.hosting_type}`))
}

export async function infraEditCommand(): Promise<void> {
  console.log(chalk.bold('\nInfra Edit — Actualizando ficha técnica de infraestructura\n'))
  const config = await loadProjectConfig()
  const current = infraDetails(config)

  const answers = await inquirer.prompt<InfraPromptAnswers>([
    { type: 'input', name: 'provider', message: 'Proveedor:', default: current.provider, filter: (v: string) => v.trim() },
    { type: 'input', name: 'plan', message: 'Plan:', default: current.plan, filter: (v: string) => v.trim() },
    { type: 'input', name: 'region', message: 'Región / datacenter:', default: current.region, filter: (v: string) => v.trim() },
    { type: 'input', name: 'server_os', message: 'Sistema operativo:', default: current.server_os, filter: (v: string) => v.trim() },
    { type: 'input', name: 'cpu', message: 'CPU / vCores:', default: current.cpu, filter: (v: string) => v.trim() },
    { type: 'input', name: 'ram', message: 'RAM:', default: current.ram, filter: (v: string) => v.trim() },
    { type: 'input', name: 'disk', message: 'Disco:', default: current.disk, filter: (v: string) => v.trim() },
    { type: 'input', name: 'ssh_host', message: 'SSH host:', default: current.ssh_host, filter: (v: string) => v.trim() },
    { type: 'input', name: 'ssh_user', message: 'SSH user:', default: current.ssh_user || 'deploy', filter: (v: string) => v.trim() },
    { type: 'input', name: 'notes', message: 'Notas:', default: current.notes, filter: (v: string) => v.trim() },
  ])

  config.infra_details = answers
  await saveProjectConfig(config)
  await infraSyncArtifacts(config)
  await logInfraChange(`Ficha de infra ${config.hosting_type} actualizada y regenerada`, [config.hosting_type])
  console.log(chalk.green(`✓ Infra actualizada y regenerada para ${config.hosting_type}`))
}
