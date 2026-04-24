import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { appendLayerChangelog } from './shared/changelog'
import {
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
  type BusinessModel,
  type EpicRecord,
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
  const normalized = status.trim().toLowerCase() as StoryStatus
  const valid: StoryStatus[] = ['draft', 'activo', 'en-desarrollo', 'en-prueba', 'completado', 'pivotado']
  if (!valid.includes(normalized)) {
    throw new Error(`Estado inválido: ${status}`)
  }
  return normalized
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
  const epicPath = ensureEpicPath(epic.id)
  await fs.ensureDir(path.dirname(epicPath))
  await fs.writeFile(epicPath, renderEpicMarkdown(epic, operator), 'utf-8')
}

async function writeStoryFile(epic: EpicRecord, story: StoryRecord, operator: string): Promise<void> {
  const storyPath = ensureStoryPath(epic.id, story.id)
  await fs.ensureDir(path.dirname(storyPath))
  await fs.writeFile(storyPath, renderStoryMarkdown(epic, story, operator), 'utf-8')
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

export async function businessEpicCreateCommand(
  id: string,
  title: string,
  options: CreateEpicOptions,
): Promise<void> {
  console.log(chalk.bold(`\n📚 Business Epic Create — ${id}\n`))
  validateEpicId(id)

  const { config, model, operator } = await loadBusinessContext()
  if (getEpic(model, id)) {
    throw new Error(`El épico '${id}' ya existe`)
  }

  const now = new Date().toISOString()
  const epic: EpicRecord = {
    id: id.toUpperCase(),
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
    payload: { title },
  })
  await registerBusinessChange({
    type: 'NUEVO',
    description: `Épico ${epic.id} creado: ${title}`,
    impact: [epic.id],
  })

  console.log(chalk.green(`✓ Épico creado: ${epic.id}`))
}

export async function businessStoryCreateCommand(
  epicId: string,
  id: string,
  title: string,
  options: CreateStoryOptions,
): Promise<void> {
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
    id: id.toUpperCase(),
    title,
    epic_id: epic.id,
    status: 'draft',
    priority: normalizePriority(options.priority),
    assignee: options.assignee?.trim() || 'sin asignar',
    role: options.as?.trim() || '[rol]',
    action: options.want?.trim() || '[acción]',
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
    payload: { epic_id: epic.id, title },
  })
  await registerBusinessChange({
    type: 'NUEVO',
    description: `Historia ${story.id} creada en ${epic.id}: ${title}`,
    impact: [epic.id, story.id],
    storiesAffected: [story.id],
  })

  console.log(chalk.green(`✓ Historia creada: ${story.id}`))
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

  target.story.status = status
  target.story.updated_at = new Date().toISOString()
  target.epic.updated_at = target.story.updated_at
  refreshEpicStatus(target.epic)
  model.updated_at = target.story.updated_at

  await saveBusinessModel(model)
  await patchStoryMetadata(target.story)
  await patchEpicMetadata(target.epic)
  await syncModelArtifacts(config, model)

  await appendEngineEvent({
    type: status === 'completado' ? 'business.story.completed' : 'business.story.updated',
    layer: 'business',
    source,
    entity: 'story',
    entity_id: target.story.id,
    payload: { status, epic_id: target.epic.id },
  })
  await registerBusinessChange({
    type: status === 'pivotado' ? 'PIVOT' : 'CAMBIO',
    description,
    impact: [target.epic.id, target.story.id],
    storiesAffected: [target.story.id],
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

export async function businessPivotCommand(targetId: string, options: PivotOptions): Promise<void> {
  console.log(chalk.bold(`\n🔀 Business Pivot — ${targetId}\n`))
  const reason = options.reason?.trim() || 'Cambio de dirección registrado por operador'
  const { config, model } = await loadBusinessContext()
  const now = new Date().toISOString()
  if (targetId.toLowerCase() === 'global') {
    model.pivots.unshift({
      id: `PV-${model.pivots.length + 1}`,
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
      payload: { reason },
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
    storyTarget.story.status = 'pivotado'
    storyTarget.story.updated_at = now
    storyTarget.epic.updated_at = now
    refreshEpicStatus(storyTarget.epic)
    model.pivots.unshift({
      id: `PV-${model.pivots.length + 1}`,
      target_id: storyTarget.story.id,
      target_type: 'story',
      reason,
      created_at: now,
    })
    model.updated_at = now
    await saveBusinessModel(model)
    await patchStoryMetadata(storyTarget.story)
    await patchEpicMetadata(storyTarget.epic)
    await syncModelArtifacts(config, model)
    await appendEngineEvent({
      type: 'business.story.pivoted',
      layer: 'business',
      source: 'cli',
      entity: 'story',
      entity_id: storyTarget.story.id,
      payload: { epic_id: storyTarget.epic.id, reason },
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

  epicTarget.status = 'pivotado'
  epicTarget.updated_at = now
  model.pivots.unshift({
    id: `PV-${model.pivots.length + 1}`,
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
    payload: { reason },
  })
  await registerBusinessChange({
    type: 'PIVOT',
    description: `Pivot registrado en ${epicTarget.id}: ${reason}`,
    impact: [epicTarget.id],
  })

  console.log(chalk.green(`✓ Pivot registrado en épico ${epicTarget.id}`))
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
    payload: { epic_id: target.epic.id },
  })

  await updateStoryStatusInternal(
    storyId,
    'completado',
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
