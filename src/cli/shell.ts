import chalk from 'chalk'
import inquirer from 'inquirer'
import { businessEpicCreateCommand, businessPivotCommand, businessStoryCreateCommand, businessStoryStatusCommand, businessSyncCommand, devStoryCompleteCommand } from '../core/business'
import { deployCommand } from '../core/deploy'
import { envSyncCommand } from '../core/env-sync'
import { exportCommand } from '../core/export'
import { healthCommand } from '../core/health'
import { initCommand } from '../core/init'
import { purgeCommand } from '../core/purge'
import { reportCommand, reportDraftCommand } from '../core/report'
import { sshVerifyCommand } from '../core/ssh-verify'
import { statusCommand } from '../core/status'
import { triggerCommand } from '../core/trigger'

type ShellCommandId =
  | '/init'
  | '/status'
  | '/health'
  | '/epic'
  | '/story'
  | '/story-status'
  | '/story-complete'
  | '/pivot'
  | '/sync'
  | '/report-draft'
  | '/report'
  | '/deploy'
  | '/trigger'
  | '/env-sync'
  | '/ssh-verify'
  | '/export'
  | '/purge'
  | '/help'
  | '/exit'

interface CommandDefinition {
  id: ShellCommandId
  label: string
  description: string
}

const COMMANDS: CommandDefinition[] = [
  { id: '/init', label: 'Nuevo proyecto', description: 'Crear un proyecto Wodlie con prompts guiados' },
  { id: '/status', label: 'Estado', description: 'Sincronizar métricas y estado del proyecto actual' },
  { id: '/health', label: 'Salud', description: 'Ver resumen de salud del proyecto' },
  { id: '/epic', label: 'Crear épico', description: 'Registrar un épico en el modelo canónico' },
  { id: '/story', label: 'Crear historia', description: 'Registrar una historia de usuario con prompts' },
  { id: '/story-status', label: 'Cambiar estado de historia', description: 'Mover una historia entre draft, desarrollo, prueba y completado' },
  { id: '/story-complete', label: 'Completar historia', description: 'Marcar una historia como terminada desde DEV' },
  { id: '/pivot', label: 'Registrar pivot', description: 'Registrar un cambio de dirección global, por épico o por historia' },
  { id: '/sync', label: 'Reconstruir negocio', description: 'Regenerar overview y artefactos derivados' },
  { id: '/report-draft', label: 'Borrador semanal', description: 'Generar el reporte interno de la semana' },
  { id: '/report', label: 'Reporte cliente', description: 'Generar el template .tex del reporte cliente' },
  { id: '/deploy', label: 'Deploy guiado', description: 'Mostrar el flujo guiado de deploy' },
  { id: '/trigger', label: 'Disparar trigger', description: 'Registrar deploy, incidente, milestone o pivot' },
  { id: '/env-sync', label: 'Sincronizar envs', description: 'Copiar variables faltantes a .env.development' },
  { id: '/ssh-verify', label: 'Verificar SSH', description: 'Probar conexión SSH según .env.development' },
  { id: '/export', label: 'Exportar proyecto', description: 'Generar .wodlie-export con snapshot y estado' },
  { id: '/purge', label: 'Purgar engine', description: 'Eliminar capas del engine tras snapshot git' },
  { id: '/help', label: 'Ayuda', description: 'Mostrar comandos disponibles' },
  { id: '/exit', label: 'Salir', description: 'Cerrar el modo interactivo' },
]

function printHelp(): void {
  console.log(chalk.bold('\nWodlie Shell\n'))
  console.log(chalk.dim('Escribe / para abrir la paleta de comandos o usa un slash command directo.\n'))
  for (const command of COMMANDS) {
    console.log(`${chalk.cyan(command.id.padEnd(15))} ${command.description}`)
  }
  console.log('')
}

async function promptCommandPalette(): Promise<ShellCommandId> {
  const { command } = await inquirer.prompt<{ command: ShellCommandId }>([
    {
      type: 'list',
      name: 'command',
      message: 'Selecciona una acción:',
      pageSize: 18,
      choices: COMMANDS.map((item) => ({
        name: `${item.label} (${item.id}) — ${item.description}`,
        value: item.id,
      })),
    },
  ])

  return command
}

async function promptProjectName(): Promise<string> {
  const { project } = await inquirer.prompt<{ project: string }>([
    {
      type: 'input',
      name: 'project',
      message: 'Nombre de la carpeta/proyecto:',
      validate: (value: string) => value.trim().length > 0 || 'Requerido',
      filter: (value: string) => value.trim(),
    },
  ])

  return project
}

async function runSlashCommand(command: ShellCommandId): Promise<boolean> {
  switch (command) {
    case '/init': {
      const project = await promptProjectName()
      await initCommand(project, {
        type: 'webapp',
        size: 'medium',
        stack: 'node',
        infra: 'vps',
      })
      return true
    }
    case '/status':
      await statusCommand()
      return true
    case '/health':
      await healthCommand()
      return true
    case '/epic': {
      const answers = await inquirer.prompt<{ id: string; title: string; description: string }>([
        {
          type: 'input',
          name: 'id',
          message: 'ID del épico:',
          default: 'EP-001',
          filter: (value: string) => value.trim().toUpperCase(),
        },
        {
          type: 'input',
          name: 'title',
          message: 'Título del épico:',
          validate: (value: string) => value.trim().length > 0 || 'Requerido',
          filter: (value: string) => value.trim(),
        },
        {
          type: 'input',
          name: 'description',
          message: 'Descripción breve:',
          default: '',
          filter: (value: string) => value.trim(),
        },
      ])
      await businessEpicCreateCommand(answers.id, answers.title, { description: answers.description || undefined })
      return true
    }
    case '/story': {
      const answers = await inquirer.prompt<{
        epicId: string
        id: string
        title: string
        role: string
        action: string
        benefit: string
        priority: 'alta' | 'media' | 'baja'
        assignee: string
      }>([
        {
          type: 'input',
          name: 'epicId',
          message: 'Épico al que pertenece:',
          default: 'EP-001',
          filter: (value: string) => value.trim().toUpperCase(),
        },
        {
          type: 'input',
          name: 'id',
          message: 'ID de la historia:',
          default: 'US-001',
          filter: (value: string) => value.trim().toUpperCase(),
        },
        {
          type: 'input',
          name: 'title',
          message: 'Título:',
          validate: (value: string) => value.trim().length > 0 || 'Requerido',
          filter: (value: string) => value.trim(),
        },
        {
          type: 'input',
          name: 'role',
          message: 'Como:',
          default: 'operador',
          filter: (value: string) => value.trim(),
        },
        {
          type: 'input',
          name: 'action',
          message: 'Quiero:',
          validate: (value: string) => value.trim().length > 0 || 'Requerido',
          filter: (value: string) => value.trim(),
        },
        {
          type: 'input',
          name: 'benefit',
          message: 'Para:',
          validate: (value: string) => value.trim().length > 0 || 'Requerido',
          filter: (value: string) => value.trim(),
        },
        {
          type: 'list',
          name: 'priority',
          message: 'Prioridad:',
          choices: ['alta', 'media', 'baja'],
          default: 'media',
        },
        {
          type: 'input',
          name: 'assignee',
          message: 'Responsable:',
          default: 'sin asignar',
          filter: (value: string) => value.trim(),
        },
      ])
      await businessStoryCreateCommand(answers.epicId, answers.id, answers.title, {
        as: answers.role,
        want: answers.action,
        soThat: answers.benefit,
        priority: answers.priority,
        assignee: answers.assignee,
      })
      return true
    }
    case '/story-status': {
      const answers = await inquirer.prompt<{ storyId: string; status: string }>([
        {
          type: 'input',
          name: 'storyId',
          message: 'Historia:',
          default: 'US-001',
          filter: (value: string) => value.trim().toUpperCase(),
        },
        {
          type: 'list',
          name: 'status',
          message: 'Nuevo estado:',
          choices: ['draft', 'activo', 'en-desarrollo', 'en-prueba', 'completado', 'pivotado'],
          default: 'en-desarrollo',
        },
      ])
      await businessStoryStatusCommand(answers.storyId, answers.status)
      return true
    }
    case '/story-complete': {
      const { storyId } = await inquirer.prompt<{ storyId: string }>([
        {
          type: 'input',
          name: 'storyId',
          message: 'Historia completada:',
          default: 'US-001',
          filter: (value: string) => value.trim().toUpperCase(),
        },
      ])
      await devStoryCompleteCommand(storyId)
      return true
    }
    case '/pivot': {
      const answers = await inquirer.prompt<{ targetId: string; reason: string }>([
        {
          type: 'input',
          name: 'targetId',
          message: 'Target (global, EP-001 o US-001):',
          default: 'global',
          filter: (value: string) => value.trim(),
        },
        {
          type: 'input',
          name: 'reason',
          message: 'Motivo del pivot:',
          validate: (value: string) => value.trim().length > 0 || 'Requerido',
          filter: (value: string) => value.trim(),
        },
      ])
      await businessPivotCommand(answers.targetId, { reason: answers.reason })
      return true
    }
    case '/sync':
      await businessSyncCommand()
      return true
    case '/report-draft':
      await reportDraftCommand()
      return true
    case '/report':
      await reportCommand()
      return true
    case '/deploy': {
      const answers = await inquirer.prompt<{ env: string; target: string; skip: string }>([
        {
          type: 'list',
          name: 'env',
          message: 'Entorno:',
          choices: ['staging', 'production'],
          default: 'staging',
        },
        {
          type: 'list',
          name: 'target',
          message: 'Target:',
          choices: ['all', 'api', 'front', 'admin', 'worker'],
          default: 'all',
        },
        {
          type: 'checkbox',
          name: 'skip',
          message: 'Checks a omitir:',
          choices: ['tests', 'e2e', 'perf', 'security', 'a11y', 'ci'],
          default: [],
        },
      ])
      const skip = Array.isArray(answers.skip) ? answers.skip.join(',') : ''
      await deployCommand({ env: answers.env, target: answers.target, skip })
      return true
    }
    case '/trigger': {
      const answers = await inquirer.prompt<{ name: string; project: string; story: string; epic: string }>([
        {
          type: 'list',
          name: 'name',
          message: 'Trigger:',
          choices: ['on-deploy', 'on-incident', 'on-milestone', 'on-pivot'],
        },
        {
          type: 'input',
          name: 'project',
          message: 'Proyecto (opcional):',
          default: '',
          filter: (value: string) => value.trim(),
        },
        {
          type: 'input',
          name: 'story',
          message: 'Historia (opcional):',
          default: '',
          filter: (value: string) => value.trim(),
        },
        {
          type: 'input',
          name: 'epic',
          message: 'Épico (opcional):',
          default: '',
          filter: (value: string) => value.trim(),
        },
      ])
      await triggerCommand(answers.name, {
        project: answers.project || undefined,
        story: answers.story || undefined,
        epic: answers.epic || undefined,
      })
      return true
    }
    case '/env-sync':
      await envSyncCommand()
      return true
    case '/ssh-verify':
      await sshVerifyCommand()
      return true
    case '/export':
      await exportCommand()
      return true
    case '/purge':
      await purgeCommand()
      return true
    case '/help':
      printHelp()
      return true
    case '/exit':
      return false
  }
}

function normalizeSlashCommand(raw: string): ShellCommandId | null {
  const normalized = raw.trim().toLowerCase()
  if (!normalized) return null

  const aliases: Record<string, ShellCommandId> = {
    '/': '/help',
    '/story-completed': '/story-complete',
    '/draft': '/report-draft',
    '/sync-business': '/sync',
    exit: '/exit',
    quit: '/exit',
  }

  const resolved = aliases[normalized] ?? normalized
  return COMMANDS.some((command) => command.id === resolved) ? (resolved as ShellCommandId) : null
}

export async function runInteractiveShell(): Promise<void> {
  console.log(chalk.bold('\nWodlie Engine — Shell interactiva\n'))
  console.log(chalk.dim('Usa / para abrir comandos, /help para verlos o /exit para salir.\n'))

  let active = true

  while (active) {
    const { rawCommand } = await inquirer.prompt<{ rawCommand: string }>([
      {
        type: 'input',
        name: 'rawCommand',
        message: 'wodlie-engine',
        prefix: '',
      },
    ])

    let command = normalizeSlashCommand(rawCommand)
    if (!command) {
      command = await promptCommandPalette()
    }

    try {
      active = await runSlashCommand(command)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error no controlado'
      console.error(chalk.red(`\n✗ ${message}\n`))
    }
  }

  console.log(chalk.dim('\nSaliendo de Wodlie Shell.\n'))
}
