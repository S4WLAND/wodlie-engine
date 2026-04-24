import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import inquirer from 'inquirer'
import { simpleGit } from 'simple-git'

interface InitOptions {
  type: string
  size: string
  stack: string
  capabilities?: string
  infra: string
}

const TEMPLATE_DIR = path.join(__dirname, '../../templates/node-fastify')
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

  if (selection.infra !== 'vps') {
    return
  }

  const dockerComposeRoot = path.join(infraRoot, 'vps', 'docker-compose')
  const capabilityDir = path.join(dockerComposeRoot, 'capabilities')
  const sizeDir = path.join(dockerComposeRoot, 'sizes')
  const profileDir = path.join(dockerComposeRoot, 'profiles')

  if (await fs.pathExists(capabilityDir)) {
    for (const item of await fs.readdir(capabilityDir)) {
      const capabilityName = path.parse(item).name
      if (!selection.capabilities.includes(capabilityName)) {
        await fs.remove(path.join(capabilityDir, item))
      }
    }
  }

  if (await fs.pathExists(sizeDir)) {
    for (const item of await fs.readdir(sizeDir)) {
      const sizeName = path.parse(item).name
      if (sizeName !== selection.size) {
        await fs.remove(path.join(sizeDir, item))
      }
    }
  }

  if (await fs.pathExists(profileDir)) {
    const selectedProfilePath = path.join(profileDir, `${selection.type}.yml`)
    const hasSelectedProfile = await fs.pathExists(selectedProfilePath)

    if (hasSelectedProfile) {
      for (const item of await fs.readdir(profileDir)) {
        const profileName = path.parse(item).name
        if (profileName !== selection.type) {
          await fs.remove(path.join(profileDir, item))
        }
      }
    }
  }
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
    ENGINE_VERSION: '1.0.0',
    DOMAIN: answers.domain,
    EMAIL: answers.email,
  })

  console.log(chalk.cyan('\n→ Copiando template...'))
  await copyTemplate(TEMPLATE_DIR, destDir)

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
    await fs.writeJson(projectConfigPath, config, { spaces: 2 })
    await updateCanonicalFiles(destDir, config, new Date().toISOString())
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
  console.log(chalk.cyan(`  wodlie status`))
  console.log(chalk.cyan(`  wodlie health`))
  console.log('')
  console.log(chalk.bold('Selección aplicada:'))
  console.log(`  type=${resolvedOptions.type} · size=${resolvedOptions.size} · stack=${resolvedOptions.stack} · infra=${resolvedOptions.infra}`)
  console.log('')

  if (caps.length > 0) {
    console.log(chalk.bold(`Capabilities activadas: ${caps.join(', ')}`))
    if (resolvedOptions.infra === 'vps') {
      console.log(chalk.dim(`  Se conservaron solo los compose de capabilities seleccionados en .infra/vps/docker-compose/capabilities/`))
    }
    console.log('')
  }
}
