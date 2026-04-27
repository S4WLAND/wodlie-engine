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

function resolveTemplateDir(): string {
  const candidates = [
    path.join(__dirname, '../templates/node-fastify'),
    path.join(__dirname, '../../src/templates/node-fastify'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error(`No se encontró el template node-fastify. Rutas probadas: ${candidates.join(', ')}`)
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

function replaceVars(content: string): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => VARIABLES[key] ?? `{{${key}}}`)
}

async function processFile(src: string, dest: string): Promise<void> {
  const ext = path.extname(src)
  const textExts = ['.ts', '.tsx', '.js', '.json', '.md', '.yml', '.yaml', '.sh', '.css', '.example', '.txt', '']

  if (textExts.includes(ext) || path.basename(src).startsWith('.env')) {
    const content = await fs.readFile(src, 'utf-8')
    await fs.outputFile(dest, replaceVars(content))
  } else {
    await fs.copy(src, dest)
  }
}

async function copyTemplate(srcDir: string, destDir: string): Promise<void> {
  const entries = await fs.readdir(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      await copyTemplate(srcPath, destPath)
    } else {
      await processFile(srcPath, destPath)
    }
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
      message: 'Stack base:',
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

async function pruneTemplateBySelection(destDir: string, selection: {
  type: string
  size: string
  infra: string
  capabilities: string[]
}): Promise<void> {
  const infraRoot = path.join(destDir, '.infra')
  const infraDirs = ['vps', 'hosting', 'cloud']

  for (const infraDir of infraDirs) {
    if (infraDir !== selection.infra) {
      await fs.remove(path.join(infraRoot, infraDir))
    }
  }

  await fs.remove(path.join(infraRoot, 'vps', 'docker-compose'))
}

async function updateCanonicalFiles(destDir: string, config: {
  capabilities: string[]
  apps: {
    backend: string
    frontend_public: string
    frontend_admin: string
  }
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
    architecture.adapters.realtime = config.capabilities.includes('realtime') ? 'websocket' : 'polling'
    await fs.writeJson(architecturePath, architecture, { spaces: 2 })
  }

  if (!await fs.pathExists(eventsPath)) {
    await fs.writeFile(eventsPath, '')
  }
}

async function writeProjectRootAgents(destDir: string): Promise<void> {
  const rootAgentsPath = path.join(destDir, 'AGENTS.md')
  const content = `# AGENTS.md

## Contexto
Proyecto gestionado con \`wodlie-engine\`.
La fuente de verdad estructural del proyecto vive en los artefactos del engine y debe operarse por CLI.

## Regla principal
No editar manualmente los artefactos estructurados del engine si existe un comando para hacerlo.
Primero usar \`wodlie-engine\`; después revisar la documentación o el código generado.

## Cómo usar el framework

### Entrada principal

\`\`\`bash
wodlie-engine
\`\`\`

Abre la consola interactiva en árbol.

Menús principales:
- \`Business\`
- \`Infra\`
- \`Reports\`
- \`Project\`

### Comandos más importantes

\`\`\`bash
wodlie-engine status
wodlie-engine health
wodlie-engine infra:edit
wodlie-engine infra:sync
wodlie-engine business:sync
wodlie-engine report:draft
wodlie-engine report
wodlie-engine dev:story:complete US-001
\`\`\`

## Flujo correcto por área

### Negocio
Usar siempre la consola o la CLI para:
- crear épicos
- crear historias
- editar épicos o historias
- cambiar estados
- registrar pivots

No editar manualmente:
- \`.wodlie-config/business.json\`
- \`.wodlie-config/events.jsonl\`
- \`.business/progress.*\`

### Infra
La infraestructura hoy es principalmente documental.

Usar:
- \`wodlie-engine infra:edit\` para actualizar proveedor, plan, CPU, RAM, SSH y notas
- \`wodlie-engine infra:sync\` para regenerar \`.infra/\` desde \`.wodlie-config/project.json\`
- \`wodlie-engine env:sync\` para completar \`.env.development\`
- \`wodlie-engine ssh:verify\` para validar acceso SSH

No editar manualmente si quieres conservar regeneración limpia:
- \`.wodlie-config/project.json\` en la parte de \`infra_details\`

Si personalizas manualmente \`.infra/\`, recuerda que \`infra:sync\` la puede regenerar.

### Desarrollo
El código vive en \`.dev/\`.
Ahí se trabaja normalmente como proyecto de software.

Usar el engine para reflejar progreso estructural:
- marcar historias completadas
- sincronizar estado
- generar reportes

## Archivos clave

- \`.wodlie-config/project.json\`: configuración general del proyecto
- \`.wodlie-config/business.json\`: modelo canónico de negocio
- \`.wodlie-config/events.jsonl\`: historial estructurado de eventos
- \`.business/\`: requerimientos, historias, reportes y métricas derivadas
- \`.infra/\`: documentación y runbooks de infraestructura
- \`.dev/\`: código fuente del proyecto
- \`.core/\`: artefactos internos del engine

## Dónde leer según la tarea
- Negocio: \`.business/AGENTS.md\`
- Infra: \`.infra/AGENTS.md\`
- Desarrollo: \`.dev/AGENTS.md\`
- Orquestación del engine: \`.core/AGENTS.md\`

## Secuencia recomendada de trabajo

1. Abrir \`wodlie-engine\`
2. Revisar o cargar negocio en \`Business\`
3. Revisar o actualizar infraestructura en \`Infra\`
4. Trabajar código en \`.dev/\`
5. Marcar avance con \`wodlie-engine status\`
6. Cerrar historias con \`wodlie-engine dev:story:complete <ID>\`
7. Generar reporte con \`wodlie-engine report:draft\`

## Reglas para la IA

- No asumir que un archivo del engine debe editarse a mano.
- Antes de modificar estructura, verificar si existe un comando del CLI.
- Si cambia negocio, usar \`Business\`.
- Si cambia la ficha de infraestructura, usar \`infra:edit\` o \`infra:sync\`.
- Si un archivo de \`.infra/\` fue personalizado manualmente, avisar antes de regenerarlo.
- Si el cambio afecta múltiples capas, revisar también \`.business/AGENTS.md\`, \`.infra/AGENTS.md\`, \`.dev/AGENTS.md\` y \`.core/AGENTS.md\`.

## Cuándo pedir confirmación humana

- antes de borrar carpetas del proyecto
- antes de regenerar \`.infra/\` si hubo edición manual importante
- antes de cambiar estados o historias sin contexto claro
- antes de operaciones destructivas o de entrega
`
  await fs.writeFile(rootAgentsPath, content, 'utf-8')
}

export async function initCommand(proyecto: string, options: InitOptions): Promise<void> {
  console.log(chalk.bold(`\n🚀 Wodlie Engine — Inicializando proyecto: ${proyecto}\n`))

  const destDir = path.join(process.cwd(), proyecto)

  if (await fs.pathExists(destDir)) {
    console.error(chalk.red(`✗ El directorio '${proyecto}' ya existe.`))
    process.exit(1)
  }

  const resolvedOptions = await resolveInitOptions(options)

  // Preguntas interactivas
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
      message: 'Dominio del proyecto (ej: miprojecto.com):',
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
      default: resolvedOptions.infra === 'vps' ? 'Ubuntu 22.04' : '',
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
  })

  console.log(chalk.cyan('\n→ Copiando template...'))
  await copyTemplate(resolveTemplateDir(), destDir)
  await writeProjectRootAgents(destDir)

  // Actualizar .wodlie-config/project.json con valores reales
  const projectConfigPath = path.join(destDir, '.wodlie-config', 'project.json')
  if (await fs.pathExists(projectConfigPath)) {
    const config = await fs.readJson(projectConfigPath)
    config.project = proyecto
    config.contract.type = answers.contractType
    config.contract.history[0].type = answers.contractType
    config.contract.history[0].started = date
    config.project_profile.type = resolvedOptions.type
    config.project_profile.size = resolvedOptions.size
    config.hosting_type = resolvedOptions.infra
    config.capabilities = caps
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

  // Actualizar .core/state.json
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
    state.generated_at = date
    await fs.writeJson(statePath, state, { spaces: 2 })
  }

  // Agregar .core/state.json al .gitignore
  const gitignorePath = path.join(destDir, '.gitignore')
  if (await fs.pathExists(gitignorePath)) {
    const existing = await fs.readFile(gitignorePath, 'utf-8')
    if (!existing.includes('.core/state.json')) {
      await fs.appendFile(gitignorePath, '\n# Wodlie Engine — estado local\n.core/state.json\n')
    }
  }

  await pruneTemplateBySelection(destDir, {
    type: resolvedOptions.type,
    size: resolvedOptions.size,
    infra: resolvedOptions.infra,
    capabilities: caps,
  })

  // Inicializar git
  console.log(chalk.cyan('→ Inicializando repositorio git...'))
  const git = simpleGit(destDir)
  await git.init()
  await git.add('.')
  await git.commit(`chore(core): inicializar proyecto con wodlie-engine v1.0.0`)

  // Resumen
  console.log(chalk.green('\n✓ Proyecto creado exitosamente\n'))
  console.log(chalk.bold('Estructura:'))
  console.log(`  ${proyecto}/`)
  console.log(`  ├── .business/     ← capa de negocio`)
  console.log(`  ├── .infra/        ← capa de infraestructura`)
  console.log(`  ├── .core/         ← orquestación del engine`)
  console.log(`  ├── .dev/          ← capa de desarrollo + código`)
  console.log(`  └── .wodlie-config/`)
  console.log('')
  console.log(chalk.bold('Próximos pasos:'))
  console.log(chalk.cyan(`  cd ${proyecto}`))
  console.log(chalk.cyan(`  cp .dev/src/backend-api/.env.example .dev/src/backend-api/.env.development`))
  console.log(chalk.cyan(`  wodlie-engine`))
  console.log(chalk.cyan(`  wodlie-engine status`))
  console.log('')
  console.log(chalk.bold('Selección aplicada:'))
  console.log(`  type=${resolvedOptions.type} · size=${resolvedOptions.size} · stack=${resolvedOptions.stack} · infra=${resolvedOptions.infra}`)
  console.log('')

  if (caps.length > 0) {
    console.log(chalk.bold(`Capabilities activadas: ${caps.join(', ')}`))
    console.log('')
  }
}
