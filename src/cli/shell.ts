import chalk from 'chalk'
import inquirer from 'inquirer'
import {
  businessEpicArchiveCommand,
  businessEpicCreateAutoCommand,
  businessEpicEditCommand,
  businessEpicStatusCommand,
  businessPivotCommand,
  businessStoryArchiveCommand,
  businessStoryCreateAutoCommand,
  businessStoryEditCommand,
  businessStoryStatusCommand,
  businessSyncCommand,
  devStoryCompleteCommand,
  listEpicsCommand,
  listStoriesCommand,
} from '../core/business'
import { healthCommand } from '../core/health'
import { infraEditCommand, infraSyncCommand } from '../core/infra'
import { initCommand } from '../core/init'
import { reportCommand, reportDraftCommand } from '../core/report'
import { statusCommand } from '../core/status'
import type { EpicRecord, StoryRecord } from '../core/shared/canonical'

type MenuValue =
  | 'business'
  | 'infra'
  | 'reports'
  | 'project'
  | 'back'
  | 'exit'
  | 'epics'
  | 'stories'
  | 'pivot'
  | 'sync'
  | 'create'
  | 'browse'
  | 'status'
  | 'health'
  | 'init'
  | 'report-draft'
  | 'report'
  | 'view'
  | 'edit'
  | 'change-status'
  | 'archive'
  | 'complete'

type StoryStatusOption = 'draft' | 'ready' | 'in-progress' | 'blocked' | 'in-review' | 'completed' | 'pivoted' | 'archived'
type EpicStatusOption = 'draft' | 'active' | 'blocked' | 'completed' | 'pivoted' | 'archived'

function printShellHeader(): void {
  console.log(chalk.bold('\nWodlie Engine — Consola interactiva\n'))
  console.log(chalk.dim('Navega por árbol. El engine genera IDs y sincroniza artefactos automáticamente.\n'))
}

async function selectMenu<T extends string>(message: string, choices: Array<{ name: string; value: T }>): Promise<T> {
  const { value } = await inquirer.prompt<{ value: T }>([
    {
      type: 'list',
      name: 'value',
      message,
      pageSize: 12,
      choices,
    },
  ])

  return value
}

async function promptText(message: string, defaultValue = ''): Promise<string> {
  const { value } = await inquirer.prompt<{ value: string }>([
    {
      type: 'input',
      name: 'value',
      message,
      default: defaultValue,
      filter: (input: string) => input.trim(),
    },
  ])

  return value
}

async function promptRequired(message: string, defaultValue = ''): Promise<string> {
  const { value } = await inquirer.prompt<{ value: string }>([
    {
      type: 'input',
      name: 'value',
      message,
      default: defaultValue,
      validate: (input: string) => input.trim().length > 0 || 'Requerido',
      filter: (input: string) => input.trim(),
    },
  ])

  return value
}

function filterEpics(epics: EpicRecord[], query: string): EpicRecord[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return epics
  return epics.filter((epic) =>
    epic.id.toLowerCase().includes(normalized)
    || epic.title.toLowerCase().includes(normalized)
    || epic.slug.toLowerCase().includes(normalized),
  )
}

function filterStories(items: Array<{ epic: EpicRecord; story: StoryRecord }>, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return items
  return items.filter(({ epic, story }) =>
    story.id.toLowerCase().includes(normalized)
    || story.title.toLowerCase().includes(normalized)
    || story.slug.toLowerCase().includes(normalized)
    || epic.id.toLowerCase().includes(normalized)
    || epic.title.toLowerCase().includes(normalized),
  )
}

async function chooseEpic(message: string): Promise<EpicRecord | null> {
  const epics = await listEpicsCommand()
  if (epics.length === 0) {
    console.log(chalk.yellow('\n⚠ No hay épicos cargados.\n'))
    return null
  }

  const query = await promptText('Buscar épico por ID, título o slug (enter para ver todo):')
  const filtered = filterEpics(epics, query)
  if (filtered.length === 0) {
    console.log(chalk.yellow('\n⚠ No hubo coincidencias.\n'))
    return null
  }

  const selectedId = await selectMenu(message, [
    ...filtered.map((epic) => ({
      name: `${epic.id} · ${epic.title} · ${epic.status}`,
      value: epic.id,
    })),
    { name: 'Volver', value: '__back__' },
  ])

  if (selectedId === '__back__') return null
  return filtered.find((epic) => epic.id === selectedId) ?? null
}

async function chooseStory(message: string): Promise<{ epic: EpicRecord; story: StoryRecord } | null> {
  const stories = await listStoriesCommand()
  if (stories.length === 0) {
    console.log(chalk.yellow('\n⚠ No hay historias cargadas.\n'))
    return null
  }

  const query = await promptText('Buscar historia por ID, título, slug o épico (enter para ver todo):')
  const filtered = filterStories(stories, query)
  if (filtered.length === 0) {
    console.log(chalk.yellow('\n⚠ No hubo coincidencias.\n'))
    return null
  }

  const selectedId = await selectMenu(message, [
    ...filtered.map(({ epic, story }) => ({
      name: `${story.id} · ${story.title} · ${story.status} · ${epic.id}`,
      value: story.id,
    })),
    { name: 'Volver', value: '__back__' },
  ])

  if (selectedId === '__back__') return null
  return filtered.find(({ story }) => story.id === selectedId) ?? null
}

function printEpicDetail(epic: EpicRecord): void {
  console.log(chalk.bold(`\n${epic.id} — ${epic.title}`))
  console.log(`Estado: ${epic.status}`)
  console.log(`Stories: ${epic.stories.length}`)
  console.log(`Slug: ${epic.slug}`)
  console.log(`Descripción: ${epic.description || 'Sin descripción'}`)
  console.log('')
}

function printStoryDetail(epic: EpicRecord, story: StoryRecord): void {
  console.log(chalk.bold(`\n${story.id} — ${story.title}`))
  console.log(`Épico: ${epic.id} — ${epic.title}`)
  console.log(`Estado: ${story.status}`)
  console.log(`Prioridad: ${story.priority}`)
  console.log(`Asignado: ${story.assignee}`)
  console.log(`Como: ${story.role}`)
  console.log(`Quiero: ${story.action}`)
  console.log(`Para: ${story.benefit}`)
  console.log('')
}

async function promptEpicStatus(): Promise<EpicStatusOption> {
  return selectMenu('Nuevo estado del épico:', [
    { name: 'draft', value: 'draft' },
    { name: 'active', value: 'active' },
    { name: 'blocked', value: 'blocked' },
    { name: 'completed', value: 'completed' },
    { name: 'pivoted', value: 'pivoted' },
    { name: 'archived', value: 'archived' },
  ])
}

async function promptStoryStatus(): Promise<StoryStatusOption> {
  return selectMenu('Nuevo estado de la historia:', [
    { name: 'draft', value: 'draft' },
    { name: 'ready', value: 'ready' },
    { name: 'in-progress', value: 'in-progress' },
    { name: 'blocked', value: 'blocked' },
    { name: 'in-review', value: 'in-review' },
    { name: 'completed', value: 'completed' },
    { name: 'pivoted', value: 'pivoted' },
    { name: 'archived', value: 'archived' },
  ])
}

async function createEpicFlow(): Promise<void> {
  const title = await promptRequired('Título del épico:')
  const description = await promptText('Descripción breve:')
  await businessEpicCreateAutoCommand(title, { description: description || undefined })
}

async function createStoryFlow(): Promise<void> {
  const epic = await chooseEpic('Selecciona el épico padre:')
  if (!epic) return

  const title = await promptRequired('Título de la historia:')
  const role = await promptRequired('Como:', 'operador')
  const action = await promptRequired('Quiero:')
  const benefit = await promptRequired('Para:')
  const priority = await selectMenu<'alta' | 'media' | 'baja'>('Prioridad:', [
    { name: 'alta', value: 'alta' },
    { name: 'media', value: 'media' },
    { name: 'baja', value: 'baja' },
  ])
  const assignee = await promptText('Responsable:', 'sin asignar')

  await businessStoryCreateAutoCommand(epic.id, title, {
    as: role,
    want: action,
    soThat: benefit,
    priority,
    assignee,
  })
}

async function epicBrowseFlow(): Promise<void> {
  let active = true
  while (active) {
    const epic = await chooseEpic('Selecciona un épico:')
    if (!epic) return

    const action = await selectMenu<MenuValue>(`Épico ${epic.id}`, [
      { name: 'Ver detalle', value: 'view' },
      { name: 'Editar', value: 'edit' },
      { name: 'Cambiar estado', value: 'change-status' },
      { name: 'Registrar pivot', value: 'pivot' },
      { name: 'Archivar', value: 'archive' },
      { name: 'Volver', value: 'back' },
    ])

    switch (action) {
      case 'view':
        printEpicDetail(epic)
        break
      case 'edit': {
        const title = await promptText('Nuevo título (enter para mantener):', epic.title)
        const description = await promptText('Nueva descripción:', epic.description)
        await businessEpicEditCommand(epic.id, { title, description })
        break
      }
      case 'change-status': {
        const status = await promptEpicStatus()
        await businessEpicStatusCommand(epic.id, status)
        break
      }
      case 'pivot': {
        const reason = await promptRequired('Motivo del pivot:')
        await businessPivotCommand(epic.id, { reason })
        break
      }
      case 'archive':
        await businessEpicArchiveCommand(epic.id)
        break
      case 'back':
        active = false
        break
    }
  }
}

async function storyBrowseFlow(): Promise<void> {
  let active = true
  while (active) {
    const target = await chooseStory('Selecciona una historia:')
    if (!target) return

    const action = await selectMenu<MenuValue>(`Historia ${target.story.id}`, [
      { name: 'Ver detalle', value: 'view' },
      { name: 'Editar', value: 'edit' },
      { name: 'Cambiar estado', value: 'change-status' },
      { name: 'Marcar completada', value: 'complete' },
      { name: 'Registrar pivot', value: 'pivot' },
      { name: 'Archivar', value: 'archive' },
      { name: 'Volver', value: 'back' },
    ])

    switch (action) {
      case 'view':
        printStoryDetail(target.epic, target.story)
        break
      case 'edit': {
        const title = await promptText('Nuevo título:', target.story.title)
        const role = await promptText('Como:', target.story.role)
        const actionText = await promptText('Quiero:', target.story.action)
        const benefit = await promptText('Para:', target.story.benefit)
        const priority = await selectMenu<'alta' | 'media' | 'baja'>('Prioridad:', [
          { name: 'alta', value: 'alta' },
          { name: 'media', value: 'media' },
          { name: 'baja', value: 'baja' },
        ])
        const assignee = await promptText('Responsable:', target.story.assignee)
        await businessStoryEditCommand(target.story.id, {
          title,
          as: role,
          want: actionText,
          soThat: benefit,
          priority,
          assignee,
        })
        break
      }
      case 'change-status': {
        const status = await promptStoryStatus()
        await businessStoryStatusCommand(target.story.id, status)
        break
      }
      case 'complete':
        await devStoryCompleteCommand(target.story.id)
        break
      case 'pivot': {
        const reason = await promptRequired('Motivo del pivot:')
        await businessPivotCommand(target.story.id, { reason })
        break
      }
      case 'archive':
        await businessStoryArchiveCommand(target.story.id)
        break
      case 'back':
        active = false
        break
    }
  }
}

async function epicsMenu(): Promise<void> {
  let active = true
  while (active) {
    const action = await selectMenu<MenuValue>('Business > Epics', [
      { name: 'Crear épico', value: 'create' },
      { name: 'Explorar / editar épicos', value: 'browse' },
      { name: 'Volver', value: 'back' },
    ])

    switch (action) {
      case 'create':
        await createEpicFlow()
        break
      case 'browse':
        await epicBrowseFlow()
        break
      case 'back':
        active = false
        break
    }
  }
}

async function storiesMenu(): Promise<void> {
  let active = true
  while (active) {
    const action = await selectMenu<MenuValue>('Business > Stories', [
      { name: 'Crear historia', value: 'create' },
      { name: 'Explorar / editar historias', value: 'browse' },
      { name: 'Volver', value: 'back' },
    ])

    switch (action) {
      case 'create':
        await createStoryFlow()
        break
      case 'browse':
        await storyBrowseFlow()
        break
      case 'back':
        active = false
        break
    }
  }
}

async function businessMenu(): Promise<void> {
  let active = true
  while (active) {
    const action = await selectMenu<MenuValue>('Business', [
      { name: 'Epics', value: 'epics' },
      { name: 'Stories', value: 'stories' },
      { name: 'Registrar pivot global', value: 'pivot' },
      { name: 'Sincronizar artefactos', value: 'sync' },
      { name: 'Volver', value: 'back' },
    ])

    switch (action) {
      case 'epics':
        await epicsMenu()
        break
      case 'stories':
        await storiesMenu()
        break
      case 'pivot': {
        const reason = await promptRequired('Motivo del pivot global:')
        await businessPivotCommand('global', { reason })
        break
      }
      case 'sync':
        await businessSyncCommand()
        break
      case 'back':
        active = false
        break
    }
  }
}

async function reportsMenu(): Promise<void> {
  let active = true
  while (active) {
    const action = await selectMenu<MenuValue>('Reports', [
      { name: 'Generar borrador semanal', value: 'report-draft' },
      { name: 'Generar template cliente', value: 'report' },
      { name: 'Volver', value: 'back' },
    ])

    switch (action) {
      case 'report-draft':
        await reportDraftCommand()
        break
      case 'report':
        await reportCommand()
        break
      case 'back':
        active = false
        break
    }
  }
}

async function infraMenu(): Promise<void> {
  let active = true
  while (active) {
    const action = await selectMenu<MenuValue>('Infra', [
      { name: 'Editar ficha de infraestructura', value: 'edit' },
      { name: 'Regenerar documentación de infra', value: 'sync' },
      { name: 'Volver', value: 'back' },
    ])

    switch (action) {
      case 'edit':
        await infraEditCommand()
        break
      case 'sync':
        await infraSyncCommand()
        break
      case 'back':
        active = false
        break
    }
  }
}

async function projectMenu(): Promise<void> {
  let active = true
  while (active) {
    const action = await selectMenu<MenuValue>('Project', [
      { name: 'Inicializar proyecto nuevo', value: 'init' },
      { name: 'Sincronizar status', value: 'status' },
      { name: 'Ver health', value: 'health' },
      { name: 'Volver', value: 'back' },
    ])

    switch (action) {
      case 'init': {
        const project = await promptRequired('Nombre del proyecto/carpeta:')
        await initCommand(project, {
          type: 'webapp',
          size: 'medium',
          stack: 'node',
          infra: 'vps',
        })
        break
      }
      case 'status':
        await statusCommand()
        break
      case 'health':
        await healthCommand()
        break
      case 'back':
        active = false
        break
    }
  }
}

export async function runInteractiveShell(): Promise<void> {
  printShellHeader()

  let active = true
  while (active) {
    try {
      const action = await selectMenu<MenuValue>('Menú principal', [
        { name: 'Business', value: 'business' },
        { name: 'Infra', value: 'infra' },
        { name: 'Reports', value: 'reports' },
        { name: 'Project', value: 'project' },
        { name: 'Salir', value: 'exit' },
      ])

      switch (action) {
        case 'business':
          await businessMenu()
          break
        case 'infra':
          await infraMenu()
          break
        case 'reports':
          await reportsMenu()
          break
        case 'project':
          await projectMenu()
          break
        case 'exit':
          active = false
          break
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error no controlado'
      console.error(chalk.red(`\n✗ ${message}\n`))
    }
  }

  console.log(chalk.dim('\nSaliendo de Wodlie Engine.\n'))
}
