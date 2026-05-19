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

function serviceModes(config: ProjectConfig): Required<NonNullable<ProjectConfig['service_modes']>> {
  return {
    backend_api: config.service_modes?.backend_api ?? 'neutral',
    frontend_public: config.service_modes?.frontend_public ?? 'neutral',
    frontend_admin: config.service_modes?.frontend_admin ?? 'neutral',
  }
}

function isPreconfiguredRuntime(config: ProjectConfig): boolean {
  const modes = serviceModes(config)
  return modes.backend_api === 'fastify'
    && modes.frontend_public === 'nextjs'
    && modes.frontend_admin === 'nextjs'
}

function unresolvedRuntimeServices(config: ProjectConfig): string[] {
  const modes = serviceModes(config)
  const unresolved: string[] = []

  if (modes.backend_api !== 'fastify') unresolved.push(`backend-api=${modes.backend_api}`)
  if (modes.frontend_public !== 'nextjs') unresolved.push(`frontend-public=${modes.frontend_public}`)
  if (modes.frontend_admin !== 'nextjs') unresolved.push(`frontend-admin=${modes.frontend_admin}`)

  return unresolved
}

function domainName(config: ProjectConfig): string {
  return config.domain?.trim() || `${config.project}.com`
}

function renderRuntimeNotice(config: ProjectConfig): string {
  if (isPreconfiguredRuntime(config)) {
    return [
      '- El stack Docker `dev/test` ya viene preconfigurado para la combinación `fastify + nextjs + nextjs`',
      '- `npm run dev:up` y `npm run test:up` deberían funcionar después de `npm run env:sync` y de instalar Docker',
      '- Redis sigue siendo opcional mediante `COMPOSE_PROFILES=redis`',
      '- `media-nginx` queda activo por defecto para servir uploads locales desde `.dev/storage/*/uploads`',
    ].join('\n')
  }

  const unresolved = unresolvedRuntimeServices(config).join(', ')
  return [
    '- El stack Docker local sigue presente como contrato base del proyecto, pero no queda preconfigurado para servicios en modo `neutral`',
    `- Hoy faltan presets runnable para: ${unresolved}`,
    '- `npm run dev:up` y `npm run test:up` fallarán temprano con un mensaje guiado hasta que cambies esos servicios a `fastify/nextjs` o personalices `.infra/docker/*` y `.infra/env/*` para tu stack real',
  ].join('\n')
}

function renderInfraReadme(config: ProjectConfig): string {
  const modes = serviceModes(config)

  return `# Infraestructura — ${config.project}

## Concepto

Esta capa define y documenta dos planos operativos complementarios:

- **local**: stacks Docker \`dev\` y \`test\`, sincronización de envs, media local, expose controlado y scripts \`npm\`
- **remoto**: documentación y runbooks de la infraestructura objetivo para \`${config.hosting_type}\`

\`.github/\` vive en la **raíz** del repo porque GitHub Actions no admite workflows fuera de ese directorio.  
\`.infra/\` concentra Docker, variables, scripts, runbooks y lógica operativa reutilizable.

## Opción activa

- Tipo de infraestructura: \`${config.hosting_type}\`
- Perfil del proyecto: \`${config.project_profile.type}\`
- Tamaño del proyecto: \`${config.project_profile.size}\`

## Composición actual

| Servicio | Modo |
|---|---|
| \`backend-api\` | \`${modes.backend_api}\` |
| \`frontend-public\` | \`${modes.frontend_public}\` |
| \`frontend-admin\` | \`${modes.frontend_admin}\` |

${renderRuntimeNotice(config)}

## Entornos de referencia

\`\`\`
development  → Docker local + hot reload
test         → Docker local prod-like + expose opcional
production   → infraestructura remota + promoción manual por servicio
\`\`\`

La promoción productiva recomendada es granular: se construye y publica una imagen por servicio, se redeploya sólo la app afectada y el workflow espera el estado real del deployment antes de marcar éxito.

## Arquitectura local — Contenedores y puertos

### Development (\`dev:up\`)

| Servicio | Puerto host | Notas |
|---|---:|---|
| \`backend-api\` | 3000 | Fastify / contrato HTTP interno |
| \`frontend-public\` | 3001 | sitio público |
| \`frontend-admin\` | 3002 | panel interno |
| \`postgres\` | 5432 | siempre activo |
| \`redis\` | 6379 | opcional via profile \`redis\` |
| \`media-nginx\` | 9000 | media local pública, siempre activo |

### Test (\`test:up\`)

| Servicio | Puerto host | Notas |
|---|---:|---|
| \`backend-api\` | 3100 | build prod-like |
| \`frontend-public\` | 3101 | build prod-like |
| \`frontend-admin\` | 3102 | build prod-like |
| \`postgres\` | 55432 | siempre activo |
| \`redis\` | 16379 | opcional via profile \`redis\` |
| \`media-nginx\` | 9100 | media local pública, siempre activo |

### Servicios opcionales y media

Redis está desactivado por defecto en ambos stacks. Para activarlo, editar \`COMPOSE_PROFILES\` en \`.infra/env/stack.dev.env\` o \`.infra/env/stack.test.env\` antes de levantar:

\`\`\`bash
COMPOSE_PROFILES=redis
\`\`\`

\`media-nginx\` está activo siempre y sirve \`/uploads\` desde:

| Entorno | URL | Directorio host |
|---|---|---|
| \`dev\` | \`http://localhost:9000/uploads\` | \`.dev/storage/dev/uploads\` |
| \`test\` | \`http://localhost:9100/uploads\` | \`.dev/storage/test/uploads\` |

### Funcionamiento simultáneo

Los stacks \`dev\` y \`test\` usan puertos distintos y pueden correr al mismo tiempo:

\`\`\`bash
npm run dev:up
npm run test:up
\`\`\`

## Directorios

| Directorio | Uso |
|---|---|
| \`docker/\` | Compose base y overlays \`dev/test\` |
| \`env/\` | templates compartidos, catálogo de claves y config de stack/expose |
| \`scripts/\` | scripts de operación local (\`env\`) y CI (\`ci\`) |
| \`${config.hosting_type}/\` | runbooks del objetivo remoto actual |

## Superficie operativa

\`\`\`bash
npm run env:sync
npm run env:check

npm run dev:up
npm run dev:logs
npm run dev:shell <servicio>
npm run dev:down

npm run test:up
npm run test:logs
npm run test:shell <servicio>
npm run test:open
npm run test:expose
npm run test:close
npm run test:down

npm run infra:status
npm run infra:ports
\`\`\`

\`<servicio>\` acepta cualquier nombre definido en los compose files, por ejemplo: \`backend-api\`, \`frontend-public\`, \`frontend-admin\`, \`postgres\`, \`redis\`, \`media-nginx\`.

Los comandos \`logs\` imprimen primero el resumen del stack y luego siguen el stream en tiempo real.  
La salida coloreada usa una convención fija por servicio para hacer más legible la operación diaria.

## Regla de operación

- La ficha técnica del servidor vive en \`.wodlie-config/project.json\`
- La operación diaria de entornos vive en \`.infra/scripts/env\`
- Los \`.env.example\` por servicio son la fuente de verdad versionada de claves
- \`npm run env:sync\` crea y actualiza \`.env.development\` y \`.env.test\` sin pisar valores existentes
- \`npm run env:sync\` también crea \`.infra/env/stack.dev.env\`, \`.infra/env/stack.test.env\` y \`.infra/env/test-expose.env\`
- \`npm run test:up\` usa URLs locales; \`npm run test:open\` genera un env temporal con URLs públicas y no deja esos valores pegados al modo local
- \`catalog.json\` sólo se reescribe cuando cambia el contrato de claves de algún servicio para evitar ruido en git
- los jobs o scripts de actualización de \`test\` deben usar \`.infra/scripts/ci/update-test-service.ps1\` para retries, corte temprano y cleanup
- cambios de credenciales en Postgres o Redis deben resolverse en el servicio real que las hospeda y documentarse en \`${config.hosting_type}/service-ops.md\`
- los frontends son stateless: consumen media por URL pública y no montan volúmenes
- el backend escribe uploads en \`MEDIA_STORAGE_DIR\`; \`media-nginx\` monta el mismo directorio en sólo lectura
`
}

function renderVpsReadme(config: ProjectConfig): string {
  const details = infraDetails(config)
  const domain = domainName(config)

  return `# VPS — ${config.project}

## Concepto

La producción vive en el VPS y se opera manualmente o mediante workflows ubicados en la raíz del repo.  
El entorno \`test\` no vive en el VPS por defecto: corre en Docker local y sólo se expone públicamente cuando vos lo activás.

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
| Panel de control | Dokploy u operador manual |

## Prerrequisitos

- VPS accesible por SSH
- dominios apuntando al IP del servidor
- reverse proxy / panel operativo
- variables y secrets registrados en el lugar correcto
- runtime env productivo configurado por servicio

## Topología objetivo

### Producción

\`\`\`
[cliente] ──HTTPS──► [reverse proxy / panel]
                        ├─ ${domain}          → frontend-public
                        ├─ admin.${domain}    → frontend-admin
                        └─ api.${domain}      → backend-api
\`\`\`

### Test expuesto

\`\`\`
[cliente] ──HTTPS──► [VPS reverse proxy]
                        ├─ public.test.${domain} ─┐
                        ├─ admin.test.${domain}  ─┼─► [stack Docker test en tu máquina]
                        └─ api.test.${domain}    ─┘
\`\`\`

## Componentes remotos

- una app productiva por servicio
- una app o servicio productivo para \`media-nginx\` si el proyecto usa uploads nativos
- proxy/TLS para producción
- proxy o estrategia de expose para \`test\`
- SSH para mantenimiento, migraciones y limpieza Docker

## Archivos importantes

- \`checklist.md\` — pasos de puesta en marcha y validación
- \`secrets.md\` — variables, examples, GitHub vars y GitHub secrets
- \`ci-cd.md\` — flujos por servicio para \`test\` local y \`production\`
- \`service-ops.md\` — operaciones sensibles sobre contenedores, storage y credenciales

## Notas operativas

${details.notes || 'Sin notas registradas.'}
`
}

function renderProviderReadme(config: ProjectConfig): string {
  const details = infraDetails(config)

  return `# ${config.hosting_type.toUpperCase()} — ${config.project}

## Estado actual

Este proyecto usa \`${config.hosting_type}\` como infraestructura objetivo, pero el engine todavía no genera un runbook especializado para ese proveedor.

## Ficha registrada

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

## Qué hacer

- usar esta carpeta para documentar el runbook real del proveedor
- mantener \`.infra/README.md\` y \`.infra/env/\` alineados
- si la estrategia cambia a VPS, actualizar \`hosting_type\` y regenerar con \`wodlie-engine infra:sync\`
`
}

function renderVpsChecklist(config: ProjectConfig): string {
  const details = infraDetails(config)
  const domain = domainName(config)

  return `# Checklist VPS — ${config.project}
> Ejecutar en orden. Cada paso es reversible.

---

## 1. Base del servidor

- [ ] **Actualizar paquetes:** \`sudo apt update && sudo apt upgrade -y\`
- [ ] **Verificar proveedor / plan:** \`${details.provider || 'pendiente'}\` / \`${details.plan || 'pendiente'}\`
- [ ] **Confirmar capacidad real:** CPU \`${details.cpu || 'pendiente'}\`, RAM \`${details.ram || 'pendiente'}\`, disco \`${details.disk || 'pendiente'}\`
- [ ] **Confirmar sistema operativo:** \`${details.server_os || 'pendiente'}\`
- [ ] **Crear usuario \`deploy\` si aún no existe**
- [ ] **Verificar SSH con \`wodlie-engine ssh:verify\`**

## 2. Dominios y routing

- [ ] **Registro A:** \`${domain}\` → VPS
- [ ] **Registro A:** \`admin.${domain}\` → VPS
- [ ] **Registro A:** \`api.${domain}\` → VPS
- [ ] **Registro A/CNAME:** \`public.test.${domain}\` → VPS
- [ ] **Registro A/CNAME:** \`admin.test.${domain}\` → VPS
- [ ] **Registro A/CNAME:** \`api.test.${domain}\` → VPS
- [ ] **Verificar propagación**

## 3. Producción

- [ ] **Crear una app productiva por servicio**
- [ ] **Configurar runtime env real por servicio**
- [ ] **Verificar SSL y routing**
- [ ] **Definir estrategia de migraciones del backend**

## 4. Runner local de test

- [ ] **Verificar \`npm run env:sync\`**
- [ ] **Verificar \`npm run test:up\`**
- [ ] **Verificar \`.infra/scripts/ci/update-test-service.ps1\`** contra backend, public y admin
- [ ] **Verificar smoke tests locales**
- [ ] **Verificar cleanup automático si falla un smoke test**
- [ ] **Verificar corte temprano si el contenedor entra en \`exited/dead\`**

## 5. Expose de test

- [ ] **Completar \`.infra/env/test-expose.env\`** en la máquina local
- [ ] **Definir comandos remotos de expose/close**
- [ ] **Verificar \`npm run test:expose\`**
- [ ] **Verificar \`npm run test:close\`**

## 6. Variables y secretos

- [ ] **Completar las variables del panel o CI/CD**
- [ ] **Documentar dónde vive cada secreto**
- [ ] **Verificar \`npm run env:check\`**
- [ ] **Revisar \`${config.hosting_type}/service-ops.md\`** antes de tocar credenciales de Postgres, Redis o media local

## 7. Promoción a producción

- [ ] **Definir workflow o runbook manual por servicio**
- [ ] **Verificar que la promoción no redeploya servicios no afectados**
- [ ] **Verificar migraciones y cleanup post-deploy**

## 8. Post-release

- [ ] **Revisar logs y despliegues**
- [ ] **Registrar cambios relevantes en runbooks**
- [ ] **Notificar al equipo/cliente cuando aplique**
`
}

function renderVpsSecrets(config: ProjectConfig): string {
  return `# Gestión de Secrets y Variables — ${config.hosting_type.toUpperCase()}

## Principio

**Nunca commitear valores reales.**  
El repo versiona sólo:

- \`.env.example\` por servicio
- \`*.env.example\` compartidos en \`.infra/env/\`
- documentación de claves y propósito

No se versionan:

- \`.env.development\`
- \`.env.test\`
- \`test-expose.env\`
- variables reales del panel o de CI/CD

## Flujo operativo de envs locales

\`\`\`
.dev/src/*/.env.example               → lista de claves de cada servicio
        │
        ├─ npm run env:sync
        ▼
.dev/src/*/.env.development/.env.test → archivos locales por servicio

.infra/env/stack.*.env.example        → valores compartidos de Docker dev/test
        │
        ├─ npm run env:sync
        ▼
.infra/env/stack.*.env                → archivos locales del stack

.infra/env/test-expose.env.example    → config de expose/close de test
        │
        ├─ npm run env:sync
        ▼
.infra/env/test-expose.env            → archivo local de expose
\`\`\`

## Fuente de verdad por capa

- \`backend-api\`, \`frontend-public\`, \`frontend-admin\`  
  \`.dev/src/<service>/.env.example\`
- stack Docker local  
  \`.infra/env/stack.dev.env.example\` y \`.infra/env/stack.test.env.example\`
- expose/close de \`test\`  
  \`.infra/env/test-expose.env.example\`
- producción  
  variables reales configuradas por servicio

## Dónde se crean los \`.env\` locales

\`npm run env:sync\` crea o completa estos archivos:

- \`.dev/src/backend-api/.env.development\`
- \`.dev/src/backend-api/.env.test\`
- \`.dev/src/frontend-public/.env.development\`
- \`.dev/src/frontend-public/.env.test\`
- \`.dev/src/frontend-admin/.env.development\`
- \`.dev/src/frontend-admin/.env.test\`

Además crea, si faltan:

- \`.infra/env/stack.dev.env\`
- \`.infra/env/stack.test.env\`
- \`.infra/env/test-expose.env\`

## Reglas

- \`npm run env:sync\` puede agregar claves faltantes, pero nunca debe pisar valores existentes
- producción no se rellena con placeholders ni con defaults de \`test\`
- si aparece una variable nueva en código, debe reflejarse en el \`.env.example\` correspondiente
- las credenciales de Postgres o Redis deben administrarse en el runtime real y documentarse en \`${config.hosting_type}/service-ops.md\`

## Variables por app

### Frontend público

- \`NEXT_PUBLIC_APP_NAME\`
- \`NEXT_PUBLIC_APP_URL\`
- \`NEXT_PUBLIC_EXTERNAL_API_URL\`
- \`INTERNAL_API_URL\`
- \`NEXT_PUBLIC_COOKIE_DOMAIN\`
- \`NEXTAUTH_URL\`
- \`NEXTAUTH_SECRET\`
- \`MEDIA_PUBLIC_URL\`
- \`PLAYWRIGHT_BASE_URL\`

### Frontend admin

- \`NEXT_PUBLIC_EXTERNAL_API_URL\`
- \`INTERNAL_API_URL\`
- \`NEXT_PUBLIC_APP_URL\`
- \`NEXT_PUBLIC_COOKIE_DOMAIN\`
- \`MEDIA_PUBLIC_URL\`
- \`NEXT_PUBLIC_REALTIME_ADAPTER\`
- \`NEXT_PUBLIC_REALTIME_URL\`
- \`NEXT_PUBLIC_POLLING_INTERVAL\`
- \`PLAYWRIGHT_BASE_URL\`

### Backend API

- \`NODE_ENV\`
- \`PORT\`
- \`HOST\`
- \`LOG_LEVEL\`
- \`JWT_SECRET\`
- \`DATABASE_URL\`
- \`QUEUE_ADAPTER\`
- \`CACHE_ADAPTER\`
- \`REDIS_URL\`
- \`MEDIA_STORAGE_DIR\`
- \`MEDIA_PUBLIC_URL\`
- \`MEDIA_MAX_IMAGE_WIDTH\`
- \`MEDIA_IMAGE_QUALITY\`
- \`ALLOWED_ORIGINS\`

## Generar secrets seguros

\`\`\`bash
openssl rand -base64 32
openssl rand -hex 16
\`\`\`
`
}

function renderVpsCiCd(): string {
  return `# CI/CD — Infraestructura remota

## Estado actual

El engine ya deja preparada la convención para:

- workflows en \`.github/workflows/\`
- scripts auxiliares en \`.infra/scripts/ci/\`
- stacks locales \`dev/test\` en \`.infra/docker/\`
- promoción manual por servicio hacia producción

No todos los proyectos arrancan con workflows activos.  
Si el proyecto sigue con servicios \`neutral\`, la parte local/documental existe pero la automatización debe completarse junto al stack real.

## Reglas del flujo

- \`test\` vive en Docker local
- \`production\` se promueve por servicio
- los frontends y el backend no se redeployan juntos por obligación
- cualquier workflow debe vivir en la **raíz** del repo, no dentro de \`.dev/\`

## Patrón recomendado para test local

1. Checkout del repo.
2. \`npm run env:sync\`
3. \`node ./.infra/scripts/env/index.mjs env check --strict\`
4. Actualizar sólo el servicio afectado con \`.infra/scripts/ci/update-test-service.ps1\`
5. Ejecutar smoke test del servicio afectado.
6. Si falla, imprimir logs y limpiar el servicio.

## Patrón recomendado para producción

1. Seleccionar un commit exacto.
2. Construir y publicar sólo la imagen del servicio afectado.
3. Desplegar sólo la app afectada.
4. Esperar el estado real del deployment remoto antes de marcar éxito.
5. Si el servicio es \`backend-api\`, ejecutar migraciones.
6. Limpiar Docker post-deploy cuando aplique.

## Política de cache Docker

- no usar \`--volumes\` en producción salvo autorización explícita
- mantener una ventana de prune conservadora
- separar cleanup de \`test\` local del cleanup del runtime productivo

## Checklist al cambiar CI/CD

Cada cambio en workflows, scripts, compose, Dockerfiles o variables debe actualizar:

- \`.infra/README.md\`
- \`.infra/vps/ci-cd.md\`
- \`.infra/vps/secrets.md\`
- \`.infra/vps/checklist.md\`
`
}

function renderVpsServiceOps(config: ProjectConfig): string {
  return `# Service Ops — ${config.hosting_type.toUpperCase()}

## Alcance

Runbook mínimo para operaciones sensibles sobre servicios compartidos como Postgres, Redis o media local.

## Regla principal

Las credenciales reales de servicios de datos no se cambian editando \`.env.example\` ni los \`stack.*.env.example\`.  
Se cambian en el runtime real que hospeda ese servicio y luego se documenta:

1. dónde vive el servicio
2. qué valor o credencial se rotó
3. qué apps quedaron afectadas
4. qué validación se ejecutó después

## Checklist de rotación

- [ ] Generar credencial nueva
- [ ] Aplicarla en el runtime real
- [ ] Actualizar la configuración consumidora por servicio
- [ ] Reiniciar o redeployar sólo las apps afectadas
- [ ] Verificar healthchecks y smoke tests
- [ ] Registrar el cambio en \`.infra/changelog.md\` o en el runbook operativo vigente

## Casos típicos

- Postgres: password del usuario de aplicación, base de datos, backups
- Redis: password, política de persistencia, puertos expuestos
- Media local: directorio host, permisos de escritura del backend, montaje sólo lectura de \`media-nginx\`, URL pública y política de cache
`
}

async function writeInfraFiles(config: ProjectConfig): Promise<void> {
  const infraDir = path.join(process.cwd(), '.infra')
  await fs.ensureDir(infraDir)
  await fs.writeFile(path.join(infraDir, 'README.md'), renderInfraReadme(config), 'utf-8')

  const providerDir = path.join(infraDir, config.hosting_type)
  await fs.ensureDir(providerDir)

  if (config.hosting_type === 'vps') {
    await fs.writeFile(path.join(providerDir, 'README.md'), renderVpsReadme(config), 'utf-8')
    await fs.writeFile(path.join(providerDir, 'checklist.md'), renderVpsChecklist(config), 'utf-8')
    await fs.writeFile(path.join(providerDir, 'secrets.md'), renderVpsSecrets(config), 'utf-8')
    await fs.writeFile(path.join(providerDir, 'ci-cd.md'), renderVpsCiCd(), 'utf-8')
    await fs.writeFile(path.join(providerDir, 'service-ops.md'), renderVpsServiceOps(config), 'utf-8')
    return
  }

  await fs.writeFile(path.join(providerDir, 'README.md'), renderProviderReadme(config), 'utf-8')
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
