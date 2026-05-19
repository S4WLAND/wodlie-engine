import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import inquirer from 'inquirer'
import { simpleGit } from 'simple-git'
import { infraSyncArtifacts } from './infra'

interface InitOptions {
  type: string
  size: string
  stack: string
  capabilities?: string
  infra: string
}

interface InfraAnswers {
  provider: string
  plan: string
  region: string
  serverOs: string
  cpu: string
  ram: string
  disk: string
  sshHost: string
  sshUser: string
  notes: string
}

interface ServiceModeAnswers {
  backend_api: 'neutral' | 'fastify'
  frontend_public: 'neutral' | 'nextjs'
  frontend_admin: 'neutral' | 'nextjs'
}

const PROJECT_TYPES = ['webapp', 'platform', 'enterprise', 'iot'] as const
const PROJECT_SIZES = ['small', 'medium', 'large'] as const
const PROJECT_STACKS = ['node', 'python', 'go'] as const
const INFRA_TYPES = ['vps', 'hosting', 'cloud'] as const
const CAPABILITY_CHOICES = [
  { name: 'ai — Agente de IA', value: 'ai' },
  { name: 'automation — Worker de automatización', value: 'automation' },
  { name: 'native — App móvil (CORS extendido)', value: 'native' },
  { name: 'realtime — WebSocket / polling', value: 'realtime' },
  { name: 'media — Worker de archivos', value: 'media' },
] as const

const VARIABLES: Record<string, string> = {}

function resolveBootstrapDir(...segments: string[]): string {
  const candidates = [
    path.join(__dirname, '../templates/project-bootstrap', ...segments),
    path.join(__dirname, '../../src/templates/project-bootstrap', ...segments),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error(`No se encontró el bootstrap project-bootstrap. Rutas probadas: ${candidates.join(', ')}`)
}

function replaceVars(content: string): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => VARIABLES[key] ?? `{{${key}}}`)
}

async function processFile(src: string, dest: string): Promise<void> {
  const ext = path.extname(src)
  const textExts = ['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.yml', '.yaml', '.sh', '.ps1', '.css', '.conf', '.example', '.txt', '']

  if (textExts.includes(ext) || path.basename(src).startsWith('.env')) {
    const content = await fs.readFile(src, 'utf-8')
    await fs.outputFile(dest, replaceVars(content))
    return
  }

  await fs.copy(src, dest)
}

async function copyTemplate(srcDir: string, destDir: string): Promise<void> {
  await fs.ensureDir(destDir)
  const entries = await fs.readdir(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      await copyTemplate(srcPath, destPath)
      continue
    }

    await processFile(srcPath, destPath)
  }
}

function hasExplicitFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

async function resolveInitOptions(options: InitOptions): Promise<InitOptions> {
  const questions = []

  if (!hasExplicitFlag('--type')) {
    questions.push({
      type: 'list',
      name: 'type',
      message: 'Tipo de proyecto:',
      choices: [...PROJECT_TYPES],
      default: options.type,
    })
  }

  if (!hasExplicitFlag('--size')) {
    questions.push({
      type: 'list',
      name: 'size',
      message: 'Tamaño inicial:',
      choices: [...PROJECT_SIZES],
      default: options.size,
    })
  }

  if (!hasExplicitFlag('--stack')) {
    questions.push({
      type: 'list',
      name: 'stack',
      message: 'Stack base (metadata / compatibilidad):',
      choices: [...PROJECT_STACKS],
      default: options.stack,
    })
  }

  if (!hasExplicitFlag('--infra')) {
    questions.push({
      type: 'list',
      name: 'infra',
      message: 'Infraestructura objetivo:',
      choices: [...INFRA_TYPES],
      default: options.infra,
    })
  }

  const overrides = questions.length > 0
    ? await inquirer.prompt<Partial<InitOptions>>(questions)
    : {}

  return {
    ...options,
    ...overrides,
  }
}

async function resolveServiceModes(): Promise<ServiceModeAnswers> {
  return inquirer.prompt<ServiceModeAnswers>([
    {
      type: 'list',
      name: 'backend_api',
      message: 'backend-api: modo inicial',
      choices: [
        { name: 'neutral — estructura vacía y documentada', value: 'neutral' },
        { name: 'fastify — base runnable con arquitectura modular', value: 'fastify' },
      ],
      default: 'neutral',
    },
    {
      type: 'list',
      name: 'frontend_public',
      message: 'frontend-public: modo inicial',
      choices: [
        { name: 'neutral — estructura vacía y documentada', value: 'neutral' },
        { name: 'nextjs — base runnable con App Router', value: 'nextjs' },
      ],
      default: 'neutral',
    },
    {
      type: 'list',
      name: 'frontend_admin',
      message: 'frontend-admin: modo inicial',
      choices: [
        { name: 'neutral — estructura vacía y documentada', value: 'neutral' },
        { name: 'nextjs — base runnable con App Router', value: 'nextjs' },
      ],
      default: 'neutral',
    },
  ])
}

async function copySelectedServicePresets(destDir: string, modes: ServiceModeAnswers): Promise<void> {
  const services: Array<{ id: string; mode: string }> = [
    { id: 'backend-api', mode: modes.backend_api },
    { id: 'frontend-public', mode: modes.frontend_public },
    { id: 'frontend-admin', mode: modes.frontend_admin },
  ]

  for (const service of services) {
    const sourceDir = resolveBootstrapDir('services', service.id, service.mode)
    const targetDir = path.join(destDir, '.dev', 'src', service.id)
    await copyTemplate(sourceDir, targetDir)
  }
}

async function updateCanonicalFiles(destDir: string, config: {
  capabilities: string[]
  apps: {
    backend: string
    frontend_public: string
    frontend_admin: string
  }
  service_modes: ServiceModeAnswers
}, dateIso: string): Promise<void> {
  const businessPath = path.join(destDir, '.wodlie-config', 'business.json')
  const architecturePath = path.join(destDir, '.wodlie-config', 'architecture.json')
  const eventsPath = path.join(destDir, '.wodlie-config', 'events.jsonl')

  if (await fs.pathExists(businessPath)) {
    const business = await fs.readJson(businessPath)
    business.updated_at = dateIso
    await fs.writeJson(businessPath, business, { spaces: 2 })
  }

  if (await fs.pathExists(architecturePath)) {
    const architecture = await fs.readJson(architecturePath)
    architecture.updated_at = dateIso
    architecture.apps = config.apps
    architecture.capabilities = config.capabilities
    architecture.service_modes = config.service_modes
    architecture.adapters.realtime = config.capabilities.includes('realtime') ? 'websocket' : 'polling'
    await fs.writeJson(architecturePath, architecture, { spaces: 2 })
  }

  if (!await fs.pathExists(eventsPath)) {
    await fs.writeFile(eventsPath, '')
  }
}

function hasPreconfiguredRuntime(modes: ServiceModeAnswers): boolean {
  return modes.backend_api === 'fastify'
    && modes.frontend_public === 'nextjs'
    && modes.frontend_admin === 'nextjs'
}

function resolveStackGuidelineVars(modes: ServiceModeAnswers): Record<string, string> {
  return {
    BACKEND_STACK: modes.backend_api === 'fastify'
      ? 'Node.js 20 + Fastify 4 + TypeScript 5'
      : 'pendiente segun preset neutral',
    ORM_STACK: modes.backend_api === 'fastify'
      ? 'Drizzle ORM + drizzle-kit'
      : 'pendiente',
    DB_STACK: 'PostgreSQL 16',
    FRONTEND_STACK: modes.frontend_public === 'nextjs' || modes.frontend_admin === 'nextjs'
      ? 'Next.js 16 + React 19 + TypeScript 5'
      : 'pendiente segun preset neutral',
    STATE_MANAGEMENT: modes.frontend_public === 'nextjs' || modes.frontend_admin === 'nextjs'
      ? 'Zustand'
      : 'pendiente',
    DATA_FETCHING: modes.frontend_public === 'nextjs' || modes.frontend_admin === 'nextjs'
      ? 'TanStack React Query + Axios'
      : 'pendiente',
    STYLES_APPROACH: modes.frontend_public === 'nextjs' || modes.frontend_admin === 'nextjs'
      ? 'CSS Modules + tokens.css; admin puede incorporar shadcn/ui + Tailwind cuando el flujo lo justifique'
      : 'pendiente',
    UNIT_TEST_FRAMEWORK: 'Vitest',
    E2E_TEST_FRAMEWORK: 'Playwright',
    QUEUE_STACK: modes.backend_api === 'fastify'
      ? 'Graphile Worker por defecto; Redis/BullMQ opcional'
      : 'pendiente',
    CACHE_STACK: modes.backend_api === 'fastify'
      ? 'In-memory por defecto; Redis opcional'
      : 'pendiente',
    HTTP_CLIENT: 'Axios',
    LOGGER: 'Pino',
    VALIDATION_LIBRARY: 'Zod',
  }
}

export async function initCommand(proyecto: string, options: InitOptions): Promise<void> {
  console.log(chalk.bold(`\n🚀 Wodlie Engine — Inicializando proyecto: ${proyecto}\n`))

  const destDir = path.join(process.cwd(), proyecto)

  if (await fs.pathExists(destDir)) {
    console.error(chalk.red(`✗ El directorio '${proyecto}' ya existe.`))
    process.exit(1)
  }

  const resolvedOptions = await resolveInitOptions(options)

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'clientName',
      message: 'Nombre del cliente:',
      default: proyecto,
    },
    {
      type: 'input',
      name: 'operator',
      message: 'Nombre del operador (tú):',
      validate: (v: string) => v.trim().length > 0 || 'Requerido',
    },
    {
      type: 'input',
      name: 'domain',
      message: 'Dominio del proyecto (ej: miproyecto.com):',
      default: `${proyecto}.com`,
    },
    {
      type: 'input',
      name: 'email',
      message: 'Email para Let\'s Encrypt SSL:',
      validate: (v: string) => v.includes('@') || 'Email inválido',
    },
    {
      type: 'list',
      name: 'contractType',
      message: 'Tipo de contrato:',
      choices: ['fixed', 'subscription'],
      default: 'fixed',
    },
    {
      type: 'checkbox',
      name: 'capabilities',
      message: 'Capabilities a activar:',
      choices: [...CAPABILITY_CHOICES],
      default: options.capabilities ? options.capabilities.split(',') : [],
    },
  ])

  const serviceModes = await resolveServiceModes()

  const infraAnswers = await inquirer.prompt<InfraAnswers>([
    {
      type: 'input',
      name: 'provider',
      message: 'Proveedor de infraestructura:',
      default: resolvedOptions.infra === 'vps' ? 'Hostinger' : '',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'input',
      name: 'plan',
      message: 'Plan o producto contratado:',
      default: '',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'input',
      name: 'region',
      message: 'Región / datacenter:',
      default: '',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'input',
      name: 'serverOs',
      message: 'Sistema operativo del servidor:',
      default: resolvedOptions.infra === 'vps' ? 'Ubuntu 24.04' : '',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'input',
      name: 'cpu',
      message: 'CPU / vCores:',
      default: resolvedOptions.size === 'large' ? '4 vCPU' : resolvedOptions.size === 'medium' ? '2 vCPU' : '1 vCPU',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'input',
      name: 'ram',
      message: 'RAM:',
      default: resolvedOptions.size === 'large' ? '8 GB' : resolvedOptions.size === 'medium' ? '4 GB' : '2 GB',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'input',
      name: 'disk',
      message: 'Disco / almacenamiento:',
      default: '',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'input',
      name: 'sshHost',
      message: 'SSH host o IP:',
      default: '',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'input',
      name: 'sshUser',
      message: 'SSH user:',
      default: 'deploy',
      filter: (value: string) => value.trim(),
    },
    {
      type: 'input',
      name: 'notes',
      message: 'Notas libres de infraestructura:',
      default: '',
      filter: (value: string) => value.trim(),
    },
  ])

  const date = new Date().toISOString().split('T')[0]
  const caps: string[] = answers.capabilities

  Object.assign(VARIABLES, {
    PROJECT_NAME: proyecto,
    CLIENT_NAME: answers.clientName,
    OPERATOR: answers.operator,
    DATE: date,
    CONTRACT_TYPE: answers.contractType,
    PROJECT_TYPE: resolvedOptions.type,
    PROJECT_SIZE: resolvedOptions.size,
    PROJECT_STACK: resolvedOptions.stack,
    INFRA_TYPE: resolvedOptions.infra,
    INFRA_PROVIDER: infraAnswers.provider,
    INFRA_PLAN: infraAnswers.plan,
    INFRA_REGION: infraAnswers.region,
    INFRA_SERVER_OS: infraAnswers.serverOs,
    INFRA_CPU: infraAnswers.cpu,
    INFRA_RAM: infraAnswers.ram,
    INFRA_DISK: infraAnswers.disk,
    INFRA_SSH_HOST: infraAnswers.sshHost,
    INFRA_SSH_USER: infraAnswers.sshUser,
    INFRA_NOTES: infraAnswers.notes,
    ENGINE_VERSION: '1.0.0',
    DOMAIN: answers.domain,
    EMAIL: answers.email,
    BACKEND_API_MODE: serviceModes.backend_api,
    FRONTEND_PUBLIC_MODE: serviceModes.frontend_public,
    FRONTEND_ADMIN_MODE: serviceModes.frontend_admin,
    ...resolveStackGuidelineVars(serviceModes),
  })

  console.log(chalk.cyan('\n→ Copiando bootstrap base...'))
  await copyTemplate(resolveBootstrapDir('root'), destDir)

  console.log(chalk.cyan('→ Materializando servicios seleccionados...'))
  await copySelectedServicePresets(destDir, serviceModes)

  const projectConfigPath = path.join(destDir, '.wodlie-config', 'project.json')
  if (await fs.pathExists(projectConfigPath)) {
    const config = await fs.readJson(projectConfigPath)
    config.project = proyecto
    config.domain = answers.domain
    config.acme_email = answers.email
    config.contract.type = answers.contractType
    config.contract.history[0].type = answers.contractType
    config.contract.history[0].started = date
    config.project_profile.type = resolvedOptions.type
    config.project_profile.size = resolvedOptions.size
    config.hosting_type = resolvedOptions.infra
    config.capabilities = caps
    config.stack = resolvedOptions.stack
    config.apps = {
      backend: 'backend-api',
      frontend_public: 'frontend-public',
      frontend_admin: 'frontend-admin',
    }
    config.service_modes = serviceModes
    config.infra_details = {
      provider: infraAnswers.provider,
      plan: infraAnswers.plan,
      region: infraAnswers.region,
      server_os: infraAnswers.serverOs,
      cpu: infraAnswers.cpu,
      ram: infraAnswers.ram,
      disk: infraAnswers.disk,
      ssh_host: infraAnswers.sshHost,
      ssh_user: infraAnswers.sshUser,
      notes: infraAnswers.notes,
    }
    await fs.writeJson(projectConfigPath, config, { spaces: 2 })
    await updateCanonicalFiles(destDir, config, new Date().toISOString())
    const previousCwd = process.cwd()
    process.chdir(destDir)
    try {
      await infraSyncArtifacts(config)
    } finally {
      process.chdir(previousCwd)
    }
  }

  const statePath = path.join(destDir, '.core', 'state.json')
  if (await fs.pathExists(statePath)) {
    const state = await fs.readJson(statePath)
    state.project = proyecto
    state.contract.type = answers.contractType
    state.contract.history[0].type = answers.contractType
    state.contract.history[0].started = date
    state.project_profile.type = resolvedOptions.type
    state.project_profile.size = resolvedOptions.size
    state.hosting_type = resolvedOptions.infra
    state.stack = resolvedOptions.stack
    state.service_modes = serviceModes
    state.generated_at = date
    await fs.writeJson(statePath, state, { spaces: 2 })
  }

  const gitignorePath = path.join(destDir, '.gitignore')
  if (await fs.pathExists(gitignorePath)) {
    const existing = await fs.readFile(gitignorePath, 'utf-8')
    if (!existing.includes('.core/state.json')) {
      await fs.appendFile(gitignorePath, '\n# Wodlie Engine — estado local\n.core/state.json\n')
    }
  }

  console.log(chalk.cyan('→ Inicializando repositorio git...'))
  const git = simpleGit(destDir)
  await git.init()
  await git.add('.')
  await git.commit('chore(core): inicializar proyecto con wodlie-engine v1.0.0')

  console.log(chalk.green('\n✓ Proyecto creado exitosamente\n'))
  console.log(chalk.bold('Estructura:'))
  console.log(`  ${proyecto}/`)
  console.log('  ├── .business/     ← capa de negocio')
  console.log('  ├── .infra/        ← Docker, envs, scripts y runbooks')
  console.log('  ├── .core/         ← orquestación del engine')
  console.log('  ├── .dev/          ← código, tests y estándares')
  console.log('  ├── .github/       ← workflows cuando el proyecto los adopte')
  console.log('  └── .wodlie-config/')
  console.log('')
  console.log(chalk.bold('Selección aplicada:'))
  console.log(`  type=${resolvedOptions.type} · size=${resolvedOptions.size} · stack=${resolvedOptions.stack} · infra=${resolvedOptions.infra}`)
  console.log(`  backend-api=${serviceModes.backend_api} · frontend-public=${serviceModes.frontend_public} · frontend-admin=${serviceModes.frontend_admin}`)
  console.log('')

  if (caps.length > 0) {
    console.log(chalk.bold(`Capabilities activadas: ${caps.join(', ')}`))
    console.log('')
  }

  console.log(chalk.bold('Próximos pasos:'))
  console.log(chalk.cyan(`  cd ${proyecto}`))
  console.log(chalk.cyan('  npm run env:sync'))
  if (hasPreconfiguredRuntime(serviceModes)) {
    console.log(chalk.cyan('  npm run dev:up'))
  } else {
    console.log(chalk.yellow('  completar o sustituir los servicios neutral antes de usar npm run dev:up / npm run test:up'))
  }
  console.log(chalk.cyan('  wodlie-engine'))
  console.log(chalk.cyan('  wodlie-engine status'))
  console.log('')
}
