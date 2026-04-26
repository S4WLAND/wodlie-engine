import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { appendLayerChangelog } from './shared/changelog'
import {
  allocateNextEpicId,
  allocateNextPivotId,
  allocateNextStoryId,
  appendEngineEvent,
  ensureCanonicalFiles,
  ensureEpicPath,
  ensureStoryPath,
  getBusinessProgress,
  getEpic,
  getStory,
  isoDate,
  loadBusinessModel,
  refreshEpicStatus,
  saveBusinessModel,
  slugify,
  type BusinessModel,
  type EpicRecord,
  type EpicStatus,
  type StoryPriority,
  type StoryRecord,
  type StoryStatus,
} from './shared/canonical'
import {
  patchEpicMetadata,
  patchStoryMetadata,
  renderEpicMarkdown,
  renderStoryMarkdown,
  syncBusinessArtifacts,
} from './shared/business-artifacts'
import { loadProjectConfig } from './shared/config'

interface CreateEpicOptions {
  description?: string
}

interface CreateStoryOptions {
  as?: string
  want?: string
  soThat?: string
  priority?: StoryPriority
  assignee?: string
}

interface EditEpicOptions {
  title?: string
  description?: string
}

interface EditStoryOptions {
  title?: string
  as?: string
  want?: string
  soThat?: string
  priority?: StoryPriority
  assignee?: string
}

interface PivotOptions {
  reason?: string
}

function getOperatorName(): string {
  return process.env.GIT_AUTHOR_NAME
    || process.env.GIT_COMMITTER_NAME
    || process.env.USERNAME
    || process.env.USER
    || 'operador'
}

async function loadBusinessContext() {
  const config = await loadProjectConfig()
  await ensureCanonicalFiles(config, new Date().toISOString())
  const model = await loadBusinessModel()

  return {
    config,
    model,
    operator: getOperatorName(),
  }
}

function validateEpicId(id: string): void {
  if (!/^EP-\d{3}$/i.test(id)) {
    throw new Error('El ID del épico debe seguir el formato EP-001')
  }
}

function validateStoryId(id: string): void {
  if (!/^US-\d{3}$/i.test(id)) {
    throw new Error('El ID de la historia debe seguir el formato US-001')
  }
}

function normalizeStoryStatus(status: string): StoryStatus {
  const normalized = status.trim().toLowerCase()
  const aliases: Record<string, StoryStatus> = {
    draft: 'draft',
    activo: 'ready',
    ready: 'ready',
    'en-desarrollo': 'in-progress',
    'in-progress': 'in-progress',
    bloqueado: 'blocked',
    blocked: 'blocked',
    'en-prueba': 'in-review',
    'in-review': 'in-review',
    completado: 'completed',
    completed: 'completed',
    pivotado: 'pivoted',
    pivoted: 'pivoted',
    archivado: 'archived',
    archived: 'archived',
  }
  const resolved = aliases[normalized]
  if (!resolved) {
    throw new Error(`Estado inválido: ${status}`)
  }
  return resolved
}

function normalizeEpicStatus(status: string): EpicStatus {
  const normalized = status.trim().toLowerCase()
  const aliases: Record<string, EpicStatus> = {
    draft: 'draft',
    activo: 'active',
    active: 'active',
    bloqueado: 'blocked',
    blocked: 'blocked',
    completado: 'completed',
    completed: 'completed',
    pivotado: 'pivoted',
    pivoted: 'pivoted',
    archivado: 'archived',
    archived: 'archived',
  }
  const resolved = aliases[normalized]
  if (!resolved) {
    throw new Error(`Estado inválido: ${status}`)
  }
  return resolved
}

function normalizePriority(priority: string | undefined): StoryPriority {
  const normalized = (priority ?? 'media').trim().toLowerCase() as StoryPriority
  const valid: StoryPriority[] = ['alta', 'media', 'baja']
  if (!valid.includes(normalized)) {
    throw new Error(`Prioridad inválida: ${priority}`)
  }
  return normalized
}

async function writeEpicFile(epic: EpicRecord, operator: string): Promise<void> {
  const epicPath = ensureEpicPath(epic.id, epic.slug)
  await fs.ensureDir(path.dirname(epicPath))
  await fs.writeFile(epicPath, renderEpicMarkdown(epic, operator), 'utf-8')
}

async function writeStoryFile(epic: EpicRecord, story: StoryRecord, operator: string): Promise<void> {
  const storyPath = ensureStoryPath(epic.id, story.id, epic.slug, story.slug)
  await fs.ensureDir(path.dirname(storyPath))
  await fs.writeFile(storyPath, renderStoryMarkdown(epic, story, operator), 'utf-8')
}

async function renameEpicArtifacts(epic: EpicRecord): Promise<void> {
  const legacyPath = ensureEpicPath(epic.id)
  const targetPath = ensureEpicPath(epic.id, epic.slug)

  if (legacyPath !== targetPath && await fs.pathExists(legacyPath)) {
    await fs.ensureDir(path.dirname(targetPath))
    await fs.move(path.dirname(legacyPath), path.dirname(targetPath), { overwrite: true })
  }
}

async function renameStoryArtifacts(epic: EpicRecord, story: StoryRecord): Promise<void> {
  const legacyPath = ensureStoryPath(epic.id, story.id)
  const targetPath = ensureStoryPath(epic.id, story.id, epic.slug, story.slug)
  if (legacyPath !== targetPath && await fs.pathExists(legacyPath)) {
    await fs.ensureDir(path.dirname(targetPath))
    await fs.move(legacyPath, targetPath, { overwrite: true })
  }
}

function diffChangedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  return Object.keys(after).filter((key) => before[key] !== after[key])
}

async function registerBusinessChange(params: {
  type: string
  description: string
  impact: string[]
  storiesAffected?: string[]
}) {
  const operator = getOperatorName()
  const date = isoDate()
  await appendLayerChangelog({
    date,
    layer: 'business',
    type: params.type,
    description: params.description,
    operator,
    impact: params.impact,
    stories_affected: params.storiesAffected ?? [],
  })
}

async function syncModelArtifacts(config: Awaited<ReturnType<typeof loadProjectConfig>>, model: BusinessModel): Promise<void> {
  await syncBusinessArtifacts(config, model)
}

function buildStoryPayload(story: StoryRecord) {
  return {
    title: story.title,
    slug: story.slug,
    status: story.status,
    priority: story.priority,
    assignee: story.assignee,
    role: story.role,
    action: story.action,
    benefit: story.benefit,
  }
}

function buildEpicPayload(epic: EpicRecord) {
  return {
    title: epic.title,
    slug: epic.slug,
    description: epic.description,
    status: epic.status,
  }
}

export async function listEpicsCommand(): Promise<EpicRecord[]> {
  const { model } = await loadBusinessContext()
  return model.epics
}

export async function listStoriesCommand(): Promise<Array<{ epic: EpicRecord; story: StoryRecord }>> {
  const { model } = await loadBusinessContext()
  return model.epics.flatMap((epic) => epic.stories.map((story) => ({ epic, story })))
}

export async function businessEpicCreateAutoCommand(
  title: string,
  options: CreateEpicOptions = {},
): Promise<EpicRecord> {
  const { config, model, operator } = await loadBusinessContext()
  const now = new Date().toISOString()
  const epicId = allocateNextEpicId(model)
  const epic: EpicRecord = {
    id: epicId,
    slug: slugify(title),
    title,
    description: options.description ?? '',
    status: 'draft',
    created_at: now,
    updated_at: now,
    stories: [],
  }

  model.epics.push(epic)
  model.updated_at = now
  await saveBusinessModel(model)
  await writeEpicFile(epic, operator)
  await syncModelArtifacts(config, model)
  await appendEngineEvent({
    type: 'business.epic.created',
    layer: 'business',
    source: 'cli',
    entity: 'epic',
    entity_id: epic.id,
    payload: {
      title,
      slug: epic.slug,
      changed_fields: ['id', 'title', 'slug', 'description', 'status'],
    },
  })
  await registerBusinessChange({
    type: 'NUEVO',
    description: `Épico ${epic.id} creado: ${title}`,
    impact: [epic.id],
  })

  console.log(chalk.green(`✓ Épico creado: ${epic.id} — ${epic.title}`))
  return epic
}

export async function businessEpicCreateCommand(
  idOrTitle: string,
  titleOrOptions: string | CreateEpicOptions,
  maybeOptions?: CreateEpicOptions,
): Promise<void> {
  if (typeof titleOrOptions !== 'string') {
    console.log(chalk.bold(`\n📚 Business Epic Create — automático\n`))
    await businessEpicCreateAutoCommand(idOrTitle, titleOrOptions)
    return
  }

  const id = idOrTitle.toUpperCase()
  const title = titleOrOptions
  const options = maybeOptions ?? {}

  console.log(chalk.bold(`\n📚 Business Epic Create — ${id}\n`))
  validateEpicId(id)

  const { config, model, operator } = await loadBusinessContext()
  if (getEpic(model, id)) {
    throw new Error(`El épico '${id}' ya existe`)
  }

  const now = new Date().toISOString()
  const epic: EpicRecord = {
    id,
    slug: slugify(title),
    title,
    description: options.description ?? '',
    status: 'draft',
    created_at: now,
    updated_at: now,
    stories: [],
  }

  model.epics.push(epic)
  model.sequences.epic_next = Math.max(model.sequences.epic_next, Number.parseInt(id.slice(3), 10) + 1)
  model.updated_at = now
  await saveBusinessModel(model)
  await writeEpicFile(epic, operator)
  await syncModelArtifacts(config, model)
  await appendEngineEvent({
    type: 'business.epic.created',
    layer: 'business',
    source: 'cli',
    entity: 'epic',
    entity_id: epic.id,
    payload: {
      title,
      slug: epic.slug,
      changed_fields: ['id', 'title', 'slug', 'description', 'status'],
    },
  })
  await registerBusinessChange({
    type: 'NUEVO',
    description: `Épico ${epic.id} creado: ${title}`,
    impact: [epic.id],
  })

  console.log(chalk.green(`✓ Épico creado: ${epic.id}`))
}

export async function businessStoryCreateAutoCommand(
  epicId: string,
  title: string,
  options: CreateStoryOptions = {},
): Promise<StoryRecord> {
  const { config, model, operator } = await loadBusinessContext()
  const epic = getEpic(model, epicId.toUpperCase())
  if (!epic) {
    throw new Error(`No se encontró el épico '${epicId}'`)
  }

  const storyId = allocateNextStoryId(model)
  const now = new Date().toISOString()
  const story: StoryRecord = {
    id: storyId,
    slug: slugify(title),
    title,
    epic_id: epic.id,
    status: 'draft',
    priority: normalizePriority(options.priority),
    assignee: options.assignee?.trim() || 'sin asignar',
    role: options.as?.trim() || '[rol]',
    action: options.want?.trim() || '[accion]',
    benefit: options.soThat?.trim() || '[beneficio]',
    created_at: now,
    updated_at: now,
  }

  epic.stories.push(story)
  epic.updated_at = now
  refreshEpicStatus(epic)
  model.updated_at = now

  await saveBusinessModel(model)
  await writeEpicFile(epic, operator)
  await writeStoryFile(epic, story, operator)
  await syncModelArtifacts(config, model)
  await appendEngineEvent({
    type: 'business.story.created',
    layer: 'business',
    source: 'cli',
    entity: 'story',
    entity_id: story.id,
    payload: {
      epic_id: epic.id,
      title,
      slug: story.slug,
      changed_fields: ['id', 'title', 'slug', 'status', 'priority', 'assignee', 'role', 'action', 'benefit'],
    },
  })
  await registerBusinessChange({
    type: 'NUEVO',
    description: `Historia ${story.id} creada en ${epic.id}: ${title}`,
    impact: [epic.id, story.id],
    storiesAffected: [story.id],
  })

  console.log(chalk.green(`✓ Historia creada: ${story.id} — ${story.title}`))
  return story
}

export async function businessStoryCreateCommand(
  epicId: string,
  idOrTitle: string,
  titleOrOptions?: string | CreateStoryOptions,
  maybeOptions?: CreateStoryOptions,
): Promise<void> {
  if (typeof titleOrOptions !== 'string') {
    console.log(chalk.bold(`\n🧩 Business Story Create — automático\n`))
    await businessStoryCreateAutoCommand(epicId, idOrTitle, titleOrOptions ?? {})
    return
  }

  const id = idOrTitle.toUpperCase()
  const title = titleOrOptions
  const options = maybeOptions ?? {}

  console.log(chalk.bold(`\n🧩 Business Story Create — ${id}\n`))
  validateEpicId(epicId)
  validateStoryId(id)

  const { config, model, operator } = await loadBusinessContext()
  const epic = getEpic(model, epicId.toUpperCase())
  if (!epic) {
    throw new Error(`No se encontró el épico '${epicId}'`)
  }
  if (getStory(model, id.toUpperCase())) {
    throw new Error(`La historia '${id}' ya existe`)
  }

  const now = new Date().toISOString()
  const story: StoryRecord = {
    id,
    slug: slugify(title),
    title,
    epic_id: epic.id,
    status: 'draft',
    priority: normalizePriority(options.priority),
    assignee: options.assignee?.trim() || 'sin asignar',
    role: options.as?.trim() || '[rol]',
    action: options.want?.trim() || '[accion]',
    benefit: options.soThat?.trim() || '[beneficio]',
    created_at: now,
    updated_at: now,
  }

  epic.stories.push(story)
  model.sequences.story_next = Math.max(model.sequences.story_next, Number.parseInt(id.slice(3), 10) + 1)
  epic.updated_at = now
  refreshEpicStatus(epic)
  model.updated_at = now

  await saveBusinessModel(model)
  await writeEpicFile(epic, operator)
  await writeStoryFile(epic, story, operator)
  await syncModelArtifacts(config, model)
  await appendEngineEvent({
    type: 'business.story.created',
    layer: 'business',
    source: 'cli',
    entity: 'story',
    entity_id: story.id,
    payload: {
      epic_id: epic.id,
      title,
      slug: story.slug,
      changed_fields: ['id', 'title', 'slug', 'status', 'priority', 'assignee', 'role', 'action', 'benefit'],
    },
  })
  await registerBusinessChange({
    type: 'NUEVO',
    description: `Historia ${story.id} creada en ${epic.id}: ${title}`,
    impact: [epic.id, story.id],
    storiesAffected: [story.id],
  })

  console.log(chalk.green(`✓ Historia creada: ${story.id}`))
}

export async function businessEpicEditCommand(epicId: string, updates: EditEpicOptions): Promise<EpicRecord> {
  const { config, model, operator } = await loadBusinessContext()
  const epic = getEpic(model, epicId.toUpperCase())
  if (!epic) {
    throw new Error(`No se encontró el épico '${epicId}'`)
  }

  const before = buildEpicPayload(epic)
  if (updates.title?.trim()) {
    epic.title = updates.title.trim()
    epic.slug = slugify(epic.title)
  }
  if (typeof updates.description === 'string') {
    epic.description = updates.description.trim()
  }
  epic.updated_at = new Date().toISOString()
  model.updated_at = epic.updated_at

  await saveBusinessModel(model)
  await renameEpicArtifacts(epic)
  await writeEpicFile(epic, operator)
  for (const story of epic.stories) {
    await renameStoryArtifacts(epic, story)
    await writeStoryFile(epic, story, operator)
  }
  await syncModelArtifacts(config, model)

  const after = buildEpicPayload(epic)
  const changedFields = diffChangedFields(before, after)
  if (changedFields.length > 0) {
    await appendEngineEvent({
      type: 'business.epic.updated',
      layer: 'business',
      source: 'cli',
      entity: 'epic',
      entity_id: epic.id,
      payload: { changed_fields: changedFields, before, after },
    })
    await registerBusinessChange({
      type: 'CAMBIO',
      description: `Épico ${epic.id} editado (${changedFields.join(', ')})`,
      impact: [epic.id],
    })
  }

  console.log(chalk.green(`✓ Épico actualizado: ${epic.id}`))
  return epic
}

export async function businessStoryEditCommand(storyId: string, updates: EditStoryOptions): Promise<StoryRecord> {
  const { config, model, operator } = await loadBusinessContext()
  const target = getStory(model, storyId.toUpperCase())
  if (!target) {
    throw new Error(`No se encontró la historia '${storyId}'`)
  }

  const before = buildStoryPayload(target.story)
  if (updates.title?.trim()) {
    target.story.title = updates.title.trim()
    target.story.slug = slugify(target.story.title)
  }
  if (typeof updates.as === 'string') target.story.role = updates.as.trim() || target.story.role
  if (typeof updates.want === 'string') target.story.action = updates.want.trim() || target.story.action
  if (typeof updates.soThat === 'string') target.story.benefit = updates.soThat.trim() || target.story.benefit
  if (typeof updates.priority === 'string') target.story.priority = normalizePriority(updates.priority)
  if (typeof updates.assignee === 'string') target.story.assignee = updates.assignee.trim() || 'sin asignar'
  target.story.updated_at = new Date().toISOString()
  target.epic.updated_at = target.story.updated_at
  model.updated_at = target.story.updated_at

  await saveBusinessModel(model)
  await renameEpicArtifacts(target.epic)
  await renameStoryArtifacts(target.epic, target.story)
  await patchEpicMetadata(target.epic)
  await writeStoryFile(target.epic, target.story, operator)
  await syncModelArtifacts(config, model)

  const after = buildStoryPayload(target.story)
  const changedFields = diffChangedFields(before, after)
  if (changedFields.length > 0) {
    await appendEngineEvent({
      type: 'business.story.updated',
      layer: 'business',
      source: 'cli',
      entity: 'story',
      entity_id: target.story.id,
      payload: { epic_id: target.epic.id, changed_fields: changedFields, before, after },
    })
    await registerBusinessChange({
      type: 'CAMBIO',
      description: `Historia ${target.story.id} editada (${changedFields.join(', ')})`,
      impact: [target.epic.id, target.story.id],
      storiesAffected: [target.story.id],
    })
  }

  console.log(chalk.green(`✓ Historia actualizada: ${target.story.id}`))
  return target.story
}

async function updateStoryStatusInternal(
  storyId: string,
  status: StoryStatus,
  source: 'cli' | 'system',
  description: string,
): Promise<void> {
  const { config, model } = await loadBusinessContext()
  const target = getStory(model, storyId.toUpperCase())
  if (!target) {
    throw new Error(`No se encontró la historia '${storyId}'`)
  }

  const before = buildStoryPayload(target.story)
  target.story.status = status
  target.story.updated_at = new Date().toISOString()
  target.epic.updated_at = target.story.updated_at
  refreshEpicStatus(target.epic)
  model.updated_at = target.story.updated_at

  await saveBusinessModel(model)
  await patchStoryMetadata(target.story, target.epic.slug)
  await patchEpicMetadata(target.epic)
  await syncModelArtifacts(config, model)

  const after = buildStoryPayload(target.story)
  await appendEngineEvent({
    type: status === 'completed' ? 'business.story.completed' : 'business.story.updated',
    layer: 'business',
    source,
    entity: 'story',
    entity_id: target.story.id,
    payload: { status, epic_id: target.epic.id, changed_fields: diffChangedFields(before, after), before, after },
  })
  await registerBusinessChange({
    type: status === 'pivoted' ? 'PIVOT' : status === 'archived' ? 'ARCHIVE' : 'CAMBIO',
    description,
    impact: [target.epic.id, target.story.id],
    storiesAffected: [target.story.id],
  })
}

async function updateEpicStatusInternal(
  epicId: string,
  status: EpicStatus,
  description: string,
): Promise<void> {
  const { config, model } = await loadBusinessContext()
  const epic = getEpic(model, epicId.toUpperCase())
  if (!epic) {
    throw new Error(`No se encontró el épico '${epicId}'`)
  }

  const before = buildEpicPayload(epic)
  epic.status = status
  epic.updated_at = new Date().toISOString()
  model.updated_at = epic.updated_at

  await saveBusinessModel(model)
  await patchEpicMetadata(epic)
  await syncModelArtifacts(config, model)

  const after = buildEpicPayload(epic)
  await appendEngineEvent({
    type: 'business.epic.updated',
    layer: 'business',
    source: 'cli',
    entity: 'epic',
    entity_id: epic.id,
    payload: { status, changed_fields: diffChangedFields(before, after), before, after },
  })
  await registerBusinessChange({
    type: status === 'pivoted' ? 'PIVOT' : status === 'archived' ? 'ARCHIVE' : 'CAMBIO',
    description,
    impact: [epic.id],
  })
}

export async function businessStoryStatusCommand(storyId: string, status: string): Promise<void> {
  const normalized = normalizeStoryStatus(status)
  console.log(chalk.bold(`\n📝 Business Story Status — ${storyId} → ${normalized}\n`))
  await updateStoryStatusInternal(
    storyId,
    normalized,
    'cli',
    `Historia ${storyId.toUpperCase()} actualizada a estado ${normalized}`,
  )
  console.log(chalk.green(`✓ Estado actualizado: ${storyId.toUpperCase()} → ${normalized}`))
}

export async function businessEpicStatusCommand(epicId: string, status: string): Promise<void> {
  const normalized = normalizeEpicStatus(status)
  console.log(chalk.bold(`\n📝 Business Epic Status — ${epicId} → ${normalized}\n`))
  await updateEpicStatusInternal(
    epicId,
    normalized,
    `Épico ${epicId.toUpperCase()} actualizado a estado ${normalized}`,
  )
  console.log(chalk.green(`✓ Estado actualizado: ${epicId.toUpperCase()} → ${normalized}`))
}

export async function businessPivotCommand(targetId: string, options: PivotOptions): Promise<void> {
  console.log(chalk.bold(`\n🔀 Business Pivot — ${targetId}\n`))
  const reason = options.reason?.trim() || 'Cambio de dirección registrado por operador'
  const { config, model } = await loadBusinessContext()
  const now = new Date().toISOString()
  const pivotId = allocateNextPivotId(model)
  if (targetId.toLowerCase() === 'global') {
    model.pivots.unshift({
      id: pivotId,
      target_id: 'global',
      target_type: 'global',
      reason,
      created_at: now,
    })
    model.updated_at = now
    await saveBusinessModel(model)
    await syncModelArtifacts(config, model)
    await appendEngineEvent({
      type: 'business.project.pivoted',
      layer: 'business',
      source: 'cli',
      entity: 'project',
      entity_id: null,
      payload: { reason, pivot_id: pivotId, changed_fields: ['pivots'] },
    })
    await registerBusinessChange({
      type: 'PIVOT',
      description: `Pivot global registrado: ${reason}`,
      impact: ['global'],
    })
    console.log(chalk.green('✓ Pivot global registrado'))
    return
  }

  const storyTarget = getStory(model, targetId.toUpperCase())
  if (storyTarget) {
    storyTarget.story.status = 'pivoted'
    storyTarget.story.updated_at = now
    storyTarget.epic.updated_at = now
    refreshEpicStatus(storyTarget.epic)
    model.pivots.unshift({
      id: pivotId,
      target_id: storyTarget.story.id,
      target_type: 'story',
      reason,
      created_at: now,
    })
    model.updated_at = now
    await saveBusinessModel(model)
    await patchStoryMetadata(storyTarget.story, storyTarget.epic.slug)
    await patchEpicMetadata(storyTarget.epic)
    await syncModelArtifacts(config, model)
    await appendEngineEvent({
      type: 'business.story.pivoted',
      layer: 'business',
      source: 'cli',
      entity: 'story',
      entity_id: storyTarget.story.id,
      payload: { epic_id: storyTarget.epic.id, reason, pivot_id: pivotId, changed_fields: ['status', 'pivots'] },
    })
    await registerBusinessChange({
      type: 'PIVOT',
      description: `Pivot registrado en ${storyTarget.story.id}: ${reason}`,
      impact: [storyTarget.epic.id, storyTarget.story.id],
      storiesAffected: [storyTarget.story.id],
    })
    console.log(chalk.green(`✓ Pivot registrado en historia ${storyTarget.story.id}`))
    return
  }

  const epicTarget = getEpic(model, targetId.toUpperCase())
  if (!epicTarget) {
    throw new Error(`No se encontró un épico o historia con ID '${targetId}'`)
  }

  epicTarget.status = 'pivoted'
  epicTarget.updated_at = now
  model.pivots.unshift({
    id: pivotId,
    target_id: epicTarget.id,
    target_type: 'epic',
    reason,
    created_at: now,
  })
  model.updated_at = now

  await saveBusinessModel(model)
  await patchEpicMetadata(epicTarget)
  await syncModelArtifacts(config, model)
  await appendEngineEvent({
    type: 'business.epic.pivoted',
    layer: 'business',
    source: 'cli',
    entity: 'epic',
    entity_id: epicTarget.id,
    payload: { reason, pivot_id: pivotId, changed_fields: ['status', 'pivots'] },
  })
  await registerBusinessChange({
    type: 'PIVOT',
    description: `Pivot registrado en ${epicTarget.id}: ${reason}`,
    impact: [epicTarget.id],
  })

  console.log(chalk.green(`✓ Pivot registrado en épico ${epicTarget.id}`))
}

export async function businessStoryArchiveCommand(storyId: string): Promise<void> {
  await updateStoryStatusInternal(
    storyId,
    'archived',
    'cli',
    `Historia ${storyId.toUpperCase()} archivada`,
  )
}

export async function businessEpicArchiveCommand(epicId: string): Promise<void> {
  await updateEpicStatusInternal(
    epicId,
    'archived',
    `Épico ${epicId.toUpperCase()} archivado`,
  )
}

export async function devStoryCompleteCommand(storyId: string): Promise<void> {
  console.log(chalk.bold(`\n🛠 Dev Story Complete — ${storyId}\n`))
  const { model } = await loadBusinessContext()
  const target = getStory(model, storyId.toUpperCase())
  if (!target) {
    throw new Error(`No se encontró la historia '${storyId}'`)
  }

  await appendEngineEvent({
    type: 'dev.use_case.completed',
    layer: 'dev',
    source: 'cli',
    entity: 'story',
    entity_id: target.story.id,
    payload: { epic_id: target.epic.id, changed_fields: ['status'] },
  })

  await updateStoryStatusInternal(
    storyId,
    'completed',
    'system',
    `Historia ${storyId.toUpperCase()} marcada como completada desde DEV`,
  )

  console.log(chalk.green(`✓ Historia completada y sincronizada: ${storyId.toUpperCase()}`))
}

export async function businessSyncCommand(): Promise<void> {
  console.log(chalk.bold('\n🔄 Business Sync — Reconstruyendo artefactos derivados\n'))
  const { config, model } = await loadBusinessContext()
  await syncModelArtifacts(config, model)
  const progress = getBusinessProgress(model)
  console.log(chalk.green('✓ Artefactos sincronizados'))
  console.log(chalk.dim(`  Épicos: ${progress.epics.total} · Historias: ${progress.stories.total} · Pivots: ${progress.pivots}`))
}

export async function reconcileCommand(): Promise<void> {
  console.log(chalk.bold('\n🧭 Reconcile — Sincronizando modelo, docs y métricas\n'))
  await businessSyncCommand()
  console.log(chalk.green('✓ Reconciliación completada'))
}
