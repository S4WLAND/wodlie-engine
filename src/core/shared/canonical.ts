import { randomUUID } from 'crypto'
import fs from 'fs-extra'
import path from 'path'
import type { ProjectConfig } from './config'

export type StoryStatus =
  | 'draft'
  | 'activo'
  | 'en-desarrollo'
  | 'en-prueba'
  | 'completado'
  | 'pivotado'

export type EpicStatus =
  | 'draft'
  | 'activo'
  | 'completado'
  | 'pausado'
  | 'pivotado'

export type StoryPriority = 'alta' | 'media' | 'baja'

export interface StoryRecord {
  id: string
  title: string
  epic_id: string
  status: StoryStatus
  priority: StoryPriority
  assignee: string
  role: string
  action: string
  benefit: string
  created_at: string
  updated_at: string
}

export interface EpicRecord {
  id: string
  title: string
  description: string
  status: EpicStatus
  created_at: string
  updated_at: string
  stories: StoryRecord[]
}

export interface PivotRecord {
  id: string
  target_id: string
  target_type: 'epic' | 'story' | 'global'
  reason: string
  created_at: string
}

export interface BusinessModel {
  version: 1
  updated_at: string
  brief: {
    status: 'draft' | 'activo' | 'completo'
  }
  epics: EpicRecord[]
  pivots: PivotRecord[]
}

export interface ArchitectureModel {
  version: 1
  updated_at: string
  apps: ProjectConfig['apps']
  capabilities: string[]
  adapters: {
    state: 'local' | 'postgres'
    queue: 'graphile' | 'redis'
    cache: 'memory' | 'redis'
    realtime: 'polling' | 'websocket'
  }
}

export interface EngineEvent {
  id: string
  type: string
  layer: 'business' | 'infra' | 'dev' | 'core'
  source: 'cli' | 'mcp' | 'system'
  entity: 'epic' | 'story' | 'project' | 'report' | 'deploy' | 'incident' | 'module'
  entity_id: string | null
  created_at: string
  payload: Record<string, unknown>
}

export interface CanonicalPaths {
  root: string
  configDir: string
  businessModel: string
  architectureModel: string
  eventsLog: string
}

export function getCanonicalPaths(rootDir = process.cwd()): CanonicalPaths {
  const configDir = path.join(rootDir, '.wodlie-config')

  return {
    root: rootDir,
    configDir,
    businessModel: path.join(configDir, 'business.json'),
    architectureModel: path.join(configDir, 'architecture.json'),
    eventsLog: path.join(configDir, 'events.jsonl'),
  }
}

export function createDefaultBusinessModel(date: string): BusinessModel {
  return {
    version: 1,
    updated_at: date,
    brief: {
      status: 'draft',
    },
    epics: [],
    pivots: [],
  }
}

export function createDefaultArchitectureModel(config: ProjectConfig, date: string): ArchitectureModel {
  return {
    version: 1,
    updated_at: date,
    apps: config.apps,
    capabilities: config.capabilities ?? [],
    adapters: {
      state: 'local',
      queue: 'graphile',
      cache: 'memory',
      realtime: config.capabilities?.includes('realtime') ? 'websocket' : 'polling',
    },
  }
}

export async function ensureCanonicalFiles(config: ProjectConfig, date: string): Promise<void> {
  const paths = getCanonicalPaths()
  await fs.ensureDir(paths.configDir)

  if (!await fs.pathExists(paths.businessModel)) {
    await fs.writeJson(paths.businessModel, createDefaultBusinessModel(date), { spaces: 2 })
  }

  if (!await fs.pathExists(paths.architectureModel)) {
    await fs.writeJson(paths.architectureModel, createDefaultArchitectureModel(config, date), { spaces: 2 })
  }

  if (!await fs.pathExists(paths.eventsLog)) {
    await fs.writeFile(paths.eventsLog, '')
  }
}

export async function loadBusinessModel(): Promise<BusinessModel> {
  const paths = getCanonicalPaths()
  if (!await fs.pathExists(paths.businessModel)) {
    return createDefaultBusinessModel(new Date().toISOString())
  }

  return fs.readJson(paths.businessModel)
}

export async function saveBusinessModel(model: BusinessModel): Promise<void> {
  const paths = getCanonicalPaths()
  model.updated_at = new Date().toISOString()
  await fs.writeJson(paths.businessModel, model, { spaces: 2 })
}

export async function appendEngineEvent(
  partial: Omit<EngineEvent, 'id' | 'created_at'>,
): Promise<EngineEvent> {
  const paths = getCanonicalPaths()
  const event: EngineEvent = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...partial,
  }

  await fs.ensureFile(paths.eventsLog)
  await fs.appendFile(paths.eventsLog, `${JSON.stringify(event)}\n`, 'utf-8')
  return event
}

export async function readEngineEvents(): Promise<EngineEvent[]> {
  const paths = getCanonicalPaths()
  if (!await fs.pathExists(paths.eventsLog)) return []

  const content = await fs.readFile(paths.eventsLog, 'utf-8')
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as EngineEvent)
}

export function getEpic(model: BusinessModel, epicId: string): EpicRecord | undefined {
  return model.epics.find((epic) => epic.id === epicId)
}

export function getStory(
  model: BusinessModel,
  storyId: string,
): { epic: EpicRecord; story: StoryRecord } | undefined {
  for (const epic of model.epics) {
    const story = epic.stories.find((current) => current.id === storyId)
    if (story) return { epic, story }
  }

  return undefined
}

export function refreshEpicStatus(epic: EpicRecord): void {
  const statuses = epic.stories.map((story) => story.status)

  if (statuses.length === 0) {
    epic.status = 'draft'
    return
  }

  if (statuses.every((status) => status === 'completado')) {
    epic.status = 'completado'
    return
  }

  if (statuses.some((status) => status === 'pivotado')) {
    epic.status = 'pivotado'
    return
  }

  if (statuses.some((status) => status !== 'draft')) {
    epic.status = 'activo'
    return
  }

  epic.status = 'draft'
}

export function getBusinessProgress(model: BusinessModel) {
  const stories = model.epics.flatMap((epic) => epic.stories)
  const completedStories = stories.filter((story) => story.status === 'completado')
  const inProgressStories = stories.filter((story) =>
    ['activo', 'en-desarrollo', 'en-prueba'].includes(story.status),
  )
  const draftStories = stories.filter((story) => story.status === 'draft')
  const activeEpics = model.epics.filter((epic) => epic.status === 'activo')
  const completedEpics = model.epics.filter((epic) => epic.status === 'completado')

  return {
    stories: {
      total: stories.length,
      completed: completedStories.length,
      in_progress: inProgressStories.length,
      draft: draftStories.length,
    },
    epics: {
      total: model.epics.length,
      active: activeEpics.length,
      completed: completedEpics.length,
    },
    pivots: model.pivots.length,
  }
}

export function formatStoryStatus(status: StoryStatus): string {
  return status
}

export function formatEpicStatus(status: EpicStatus): string {
  return status
}

export function isoDate(date = new Date()): string {
  return date.toISOString().split('T')[0]
}

export function ensureStoryPath(epicId: string, storyId: string): string {
  return path.join(
    process.cwd(),
    '.business',
    'requirements',
    'epics',
    epicId,
    'stories',
    `${storyId}.md`,
  )
}

export function ensureEpicPath(epicId: string): string {
  return path.join(process.cwd(), '.business', 'requirements', 'epics', epicId, 'epic.md')
}
