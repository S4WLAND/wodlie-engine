import { randomUUID } from 'crypto'
import fs from 'fs-extra'
import path from 'path'
import type { ProjectConfig } from './config'

export type StoryStatus =
  | 'draft'
  | 'ready'
  | 'in-progress'
  | 'blocked'
  | 'in-review'
  | 'completed'
  | 'pivoted'
  | 'archived'

export type EpicStatus =
  | 'draft'
  | 'active'
  | 'blocked'
  | 'completed'
  | 'pivoted'
  | 'archived'

export type StoryPriority = 'alta' | 'media' | 'baja'

export interface StoryRecord {
  id: string
  slug: string
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
  slug: string
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

export interface BusinessSequences {
  epic_next: number
  story_next: number
  pivot_next: number
}

export interface BusinessModel {
  version: number
  updated_at: string
  brief: {
    status: 'draft' | 'activo' | 'completo'
  }
  sequences: BusinessSequences
  epics: EpicRecord[]
  pivots: PivotRecord[]
}

export interface ArchitectureModel {
  version: number
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

function normalizeEpicStatus(status: string | undefined): EpicStatus {
  switch ((status ?? '').trim().toLowerCase()) {
    case 'draft':
      return 'draft'
    case 'activo':
    case 'active':
    case 'en-progreso':
      return 'active'
    case 'blocked':
    case 'bloqueado':
      return 'blocked'
    case 'completado':
    case 'completed':
      return 'completed'
    case 'pivotado':
    case 'pivoted':
      return 'pivoted'
    case 'archivado':
    case 'archived':
      return 'archived'
    default:
      return 'draft'
  }
}

function normalizeStoryStatus(status: string | undefined): StoryStatus {
  switch ((status ?? '').trim().toLowerCase()) {
    case 'draft':
      return 'draft'
    case 'ready':
    case 'activo':
      return 'ready'
    case 'in-progress':
    case 'en-desarrollo':
      return 'in-progress'
    case 'blocked':
    case 'bloqueado':
      return 'blocked'
    case 'in-review':
    case 'en-prueba':
      return 'in-review'
    case 'completado':
    case 'completed':
      return 'completed'
    case 'pivotado':
    case 'pivoted':
      return 'pivoted'
    case 'archivado':
    case 'archived':
      return 'archived'
    default:
      return 'draft'
  }
}

function numericSuffix(id: string): number {
  const match = id.match(/-(\d+)$/)
  return match ? Number.parseInt(match[1], 10) : 0
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    || 'sin-titulo'
}

function ensureBusinessCompatibility(raw: Partial<BusinessModel>): BusinessModel {
  const epics = Array.isArray(raw.epics) ? raw.epics : []
  const pivots = Array.isArray(raw.pivots) ? raw.pivots : []

  const normalizedEpics: EpicRecord[] = epics.map((epic) => ({
    id: String(epic.id ?? '').toUpperCase(),
    slug: typeof epic.slug === 'string' && epic.slug.trim().length > 0 ? epic.slug : slugify(String(epic.title ?? epic.id ?? 'epic')),
    title: String(epic.title ?? ''),
    description: String(epic.description ?? ''),
    status: normalizeEpicStatus(epic.status as string | undefined),
    created_at: String(epic.created_at ?? new Date().toISOString()),
    updated_at: String(epic.updated_at ?? epic.created_at ?? new Date().toISOString()),
    stories: Array.isArray(epic.stories)
      ? epic.stories.map((story) => ({
        id: String(story.id ?? '').toUpperCase(),
        slug: typeof story.slug === 'string' && story.slug.trim().length > 0 ? story.slug : slugify(String(story.title ?? story.id ?? 'story')),
        title: String(story.title ?? ''),
        epic_id: String(story.epic_id ?? epic.id ?? '').toUpperCase(),
        status: normalizeStoryStatus(story.status as string | undefined),
        priority: (story.priority === 'alta' || story.priority === 'baja') ? story.priority : 'media',
        assignee: String(story.assignee ?? 'sin asignar'),
        role: String(story.role ?? '[rol]'),
        action: String(story.action ?? '[accion]'),
        benefit: String(story.benefit ?? '[beneficio]'),
        created_at: String(story.created_at ?? new Date().toISOString()),
        updated_at: String(story.updated_at ?? story.created_at ?? new Date().toISOString()),
      }))
      : [],
  }))

  const maxEpic = normalizedEpics.reduce((max, epic) => Math.max(max, numericSuffix(epic.id)), 0)
  const maxStory = normalizedEpics
    .flatMap((epic) => epic.stories)
    .reduce((max, story) => Math.max(max, numericSuffix(story.id)), 0)
  const maxPivot = pivots.reduce((max, pivot) => Math.max(max, numericSuffix(String(pivot.id ?? ''))), 0)

  return {
    version: typeof raw.version === 'number' ? raw.version : 2,
    updated_at: String(raw.updated_at ?? new Date().toISOString()),
    brief: {
      status: raw.brief?.status === 'activo' || raw.brief?.status === 'completo' ? raw.brief.status : 'draft',
    },
    sequences: {
      epic_next: Math.max(raw.sequences?.epic_next ?? 0, maxEpic + 1, 1),
      story_next: Math.max(raw.sequences?.story_next ?? 0, maxStory + 1, 1),
      pivot_next: Math.max(raw.sequences?.pivot_next ?? 0, maxPivot + 1, 1),
    },
    epics: normalizedEpics,
    pivots: pivots.map((pivot) => ({
      id: String(pivot.id ?? `PV-${String(maxPivot).padStart(3, '0')}`),
      target_id: String(pivot.target_id ?? 'global'),
      target_type: pivot.target_type === 'epic' || pivot.target_type === 'story' ? pivot.target_type : 'global',
      reason: String(pivot.reason ?? ''),
      created_at: String(pivot.created_at ?? new Date().toISOString()),
    })),
  }
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
    version: 2,
    updated_at: date,
    brief: {
      status: 'draft',
    },
    sequences: {
      epic_next: 1,
      story_next: 1,
      pivot_next: 1,
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
  } else {
    const current = ensureBusinessCompatibility(await fs.readJson(paths.businessModel))
    await fs.writeJson(paths.businessModel, current, { spaces: 2 })
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

  return ensureBusinessCompatibility(await fs.readJson(paths.businessModel))
}

export async function saveBusinessModel(model: BusinessModel): Promise<void> {
  const paths = getCanonicalPaths()
  model.updated_at = new Date().toISOString()
  await fs.writeJson(paths.businessModel, ensureBusinessCompatibility(model), { spaces: 2 })
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
  return model.epics.find((epic) => epic.id === epicId.toUpperCase())
}

export function getStory(
  model: BusinessModel,
  storyId: string,
): { epic: EpicRecord; story: StoryRecord } | undefined {
  for (const epic of model.epics) {
    const story = epic.stories.find((current) => current.id === storyId.toUpperCase())
    if (story) return { epic, story }
  }

  return undefined
}

export function allocateNextEpicId(model: BusinessModel): string {
  const id = `EP-${String(model.sequences.epic_next).padStart(3, '0')}`
  model.sequences.epic_next += 1
  return id
}

export function allocateNextStoryId(model: BusinessModel): string {
  const id = `US-${String(model.sequences.story_next).padStart(3, '0')}`
  model.sequences.story_next += 1
  return id
}

export function allocateNextPivotId(model: BusinessModel): string {
  const id = `PV-${String(model.sequences.pivot_next).padStart(3, '0')}`
  model.sequences.pivot_next += 1
  return id
}

export function refreshEpicStatus(epic: EpicRecord): void {
  if (epic.status === 'pivoted' || epic.status === 'archived') {
    return
  }

  const statuses = epic.stories.map((story) => story.status)

  if (statuses.length === 0) {
    epic.status = 'draft'
    return
  }

  if (statuses.some((status) => status === 'pivoted')) {
    epic.status = 'pivoted'
    return
  }

  if (statuses.some((status) => status === 'blocked')) {
    epic.status = 'blocked'
    return
  }

  const activeStatuses: StoryStatus[] = ['ready', 'in-progress', 'in-review']
  if (statuses.some((status) => activeStatuses.includes(status))) {
    epic.status = 'active'
    return
  }

  const activeStories = epic.stories.filter((story) => story.status !== 'archived' && story.status !== 'pivoted')
  if (activeStories.length > 0 && activeStories.every((story) => story.status === 'completed')) {
    epic.status = 'completed'
    return
  }

  epic.status = 'draft'
}

export function getBusinessProgress(model: BusinessModel) {
  const stories = model.epics.flatMap((epic) => epic.stories)
  const activeStories = stories.filter((story) => !['archived', 'pivoted'].includes(story.status))
  const completedStories = stories.filter((story) => story.status === 'completed')
  const blockedStories = stories.filter((story) => story.status === 'blocked')
  const wipStories = stories.filter((story) => ['ready', 'in-progress', 'in-review'].includes(story.status))
  const pivotedStories = stories.filter((story) => story.status === 'pivoted')
  const archivedStories = stories.filter((story) => story.status === 'archived')

  const storyStatusCounts: Record<StoryStatus, number> = {
    draft: 0,
    ready: 0,
    'in-progress': 0,
    blocked: 0,
    'in-review': 0,
    completed: 0,
    pivoted: 0,
    archived: 0,
  }
  for (const story of stories) {
    storyStatusCounts[story.status] += 1
  }

  const epicStatusCounts: Record<EpicStatus, number> = {
    draft: 0,
    active: 0,
    blocked: 0,
    completed: 0,
    pivoted: 0,
    archived: 0,
  }
  for (const epic of model.epics) {
    epicStatusCounts[epic.status] += 1
  }

  const completionBase = Math.max(activeStories.length + completedStories.length, 1)
  const progressPct = Math.round((completedStories.length / completionBase) * 100)
  const blockedPct = activeStories.length > 0 ? Math.round((blockedStories.length / activeStories.length) * 100) : 0
  const pivotedPct = stories.length > 0 ? Math.round((pivotedStories.length / stories.length) * 100) : 0

  return {
    summary: {
      total_epics: model.epics.length,
      total_stories: stories.length,
      active_stories: activeStories.length,
      completed_stories: completedStories.length,
      progress_pct: progressPct,
      blocked_pct: blockedPct,
      pivoted_pct: pivotedPct,
      wip: wipStories.length,
    },
    stories: {
      total: stories.length,
      active: activeStories.length,
      completed: completedStories.length,
      blocked: blockedStories.length,
      wip: wipStories.length,
      pivoted: pivotedStories.length,
      archived: archivedStories.length,
      by_status: storyStatusCounts,
    },
    epics: {
      total: model.epics.length,
      active: epicStatusCounts.active,
      completed: epicStatusCounts.completed,
      blocked: epicStatusCounts.blocked,
      pivoted: epicStatusCounts.pivoted,
      archived: epicStatusCounts.archived,
      by_status: epicStatusCounts,
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

export function getEpicDirectoryName(epic: Pick<EpicRecord, 'id' | 'slug'>): string {
  return `${epic.id}-${epic.slug}`
}

export function getStoryFileName(story: Pick<StoryRecord, 'id' | 'slug'>): string {
  return `${story.id}-${story.slug}.md`
}

function findExistingEpicDir(rootDir: string, epicId: string): string | null {
  const epicsRoot = path.join(rootDir, '.business', 'requirements', 'epics')
  if (!fs.existsSync(epicsRoot)) return null

  for (const entry of fs.readdirSync(epicsRoot)) {
    if (entry === epicId || entry.startsWith(`${epicId}-`)) {
      return entry
    }
  }

  return null
}

function findExistingStoryFile(rootDir: string, epicId: string, storyId: string): string | null {
  const epicDir = findExistingEpicDir(rootDir, epicId)
  if (!epicDir) return null

  const storiesDir = path.join(rootDir, '.business', 'requirements', 'epics', epicDir, 'stories')
  if (!fs.existsSync(storiesDir)) return null

  for (const entry of fs.readdirSync(storiesDir)) {
    if (entry === `${storyId}.md` || entry.startsWith(`${storyId}-`)) {
      return entry
    }
  }

  return null
}

export function ensureStoryPath(
  epicId: string,
  storyId: string,
  epicSlug?: string,
  storySlug?: string,
): string {
  const root = process.cwd()
  const existingEpicDir = findExistingEpicDir(root, epicId)
  const epicDir = epicSlug ? `${epicId}-${epicSlug}` : existingEpicDir ?? epicId
  const existingStoryFile = findExistingStoryFile(root, epicId, storyId)
  const storyFile = storySlug ? `${storyId}-${storySlug}.md` : existingStoryFile ?? `${storyId}.md`

  return path.join(
    root,
    '.business',
    'requirements',
    'epics',
    epicDir,
    'stories',
    storyFile,
  )
}

export function ensureEpicPath(epicId: string, epicSlug?: string): string {
  const root = process.cwd()
  const existingDir = findExistingEpicDir(root, epicId)
  const epicDir = epicSlug ? `${epicId}-${epicSlug}` : existingDir ?? epicId
  return path.join(root, '.business', 'requirements', 'epics', epicDir, 'epic.md')
}
