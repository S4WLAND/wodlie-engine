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
      choices: [
        { name: 'ai — Agente de IA', value: 'ai' },
        { name: 'automation — Worker de automatización', value: 'automation' },
        { name: 'native — App móvil (CORS extendido)', value: 'native' },
        { name: 'realtime — WebSocket / polling', value: 'realtime' },
        { name: 'media — Worker de archivos', value: 'media' },
      ],
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
    PROJECT_TYPE: options.type,
    PROJECT_SIZE: options.size,
    INFRA_TYPE: options.infra,
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
    config.project_profile.type = options.type
    config.project_profile.size = options.size
    config.hosting_type = options.infra
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
    state.project_profile.type = options.type
    state.project_profile.size = options.size
    state.hosting_type = options.infra
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

  // Eliminar capabilities no activadas del docker-compose
  if (caps.length === 0) {
    const capabilitiesDir = path.join(destDir, '.infra', 'vps', 'docker-compose', 'capabilities')
    const allCaps = ['ai', 'automation', 'native', 'realtime', 'media']
    for (const cap of allCaps) {
      const capFile = path.join(capabilitiesDir, `${cap}.yml`)
      if (await fs.pathExists(capFile)) {
        // mantener todos los capabilities en el template — el operador elige cuál usar
      }
    }
  }

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

  if (caps.length > 0) {
    console.log(chalk.bold(`Capabilities activadas: ${caps.join(', ')}`))
    console.log(chalk.dim(`  Ver .infra/vps/docker-compose/capabilities/ para los archivos de compose`))
    console.log('')
  }
}
