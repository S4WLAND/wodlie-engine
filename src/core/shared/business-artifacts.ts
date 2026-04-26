import fs from 'fs-extra'
import path from 'path'
import type { ProjectConfig } from './config'
import {
  type BusinessModel,
  type EpicRecord,
  type StoryRecord,
  ensureEpicPath,
  ensureStoryPath,
  formatEpicStatus,
  formatStoryStatus,
  getBusinessProgress,
} from './canonical'

function manualNotes(content: string | null, marker: string, fallback: string): string {
  if (!content) return fallback

  const index = content.indexOf(marker)
  if (index === -1) return fallback
  return content.slice(index)
}

function epicCompletion(epic: EpicRecord): { completed: number; total: number; progressPct: number } {
  const activeStories = epic.stories.filter((story) => !['pivoted', 'archived'].includes(story.status))
  const completed = activeStories.filter((story) => story.status === 'completed').length
  const total = activeStories.length
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, progressPct }
}

export function renderOverviewMarkdown(config: ProjectConfig, model: BusinessModel): string {
  const progress = getBusinessProgress(model)

  const epicRows = model.epics.length > 0
    ? model.epics.map((epic) => {
      const completion = epicCompletion(epic)
      return `| ${epic.id} | ${epic.title} | ${completion.total} | ${completion.completed} | ${completion.progressPct}% | ${formatEpicStatus(epic.status)} |`
    }).join('\n')
    : '| — | Sin épicos registrados | 0 | 0 | 0% | draft |'

  const detail = model.epics.length > 0
    ? model.epics.map((epic) => {
      const storyRows = epic.stories.length > 0
        ? epic.stories.map((story) =>
          `| ${story.id} | ${story.title} | ${story.priority} | ${formatStoryStatus(story.status)} | ${story.assignee} | — |`,
        ).join('\n')
        : '| — | Sin historias | — | draft | — | — |'

      return `### ${epic.id} — ${epic.title}

> ${epic.description || 'Sin descripción registrada.'}

**Dependencias externas:** ninguna

| ID | Historia | Prioridad | Estado | Asignado | Trello |
|---|---|---|---|---|---|
${storyRows}`
    }).join('\n\n---\n\n')
    : '### EP-001 — [Nombre del Épico]\n\n> Sin épicos registrados todavía.'

  const pivots = model.pivots.length > 0
    ? model.pivots.map((pivot) => `| ${pivot.id} | ${pivot.target_id} | ${pivot.reason} | ${pivot.created_at.split('T')[0]} |`).join('\n')
    : '| — | — | — | — |'

  return `# Resumen Técnico de Requerimientos
> Proyecto: ${config.project}
> Stack: ${config.stack} · Última actualización: ${model.updated_at.split('T')[0]}

---

## Estado Global del Proyecto

| Métrica | Valor |
|---|---|
| Épicos totales | ${progress.summary.total_epics} |
| Historias totales | ${progress.summary.total_stories} |
| Historias activas | ${progress.summary.active_stories} |
| Historias completadas | ${progress.summary.completed_stories} |
| Historias bloqueadas | ${progress.stories.blocked} |
| WIP actual | ${progress.summary.wip} |
| Pivots registrados | ${progress.pivots} |
| **Avance global** | **${progress.summary.progress_pct}%** |

---

## Índice de Épicos

| ID | Nombre | Historias activas | Completadas | Avance | Estado |
|---|---|---|---|---|---|
${epicRows}

---

## Backlog y Ejecución

| Estado | Historias |
|---|---|
| draft | ${progress.stories.by_status.draft} |
| ready | ${progress.stories.by_status.ready} |
| in-progress | ${progress.stories.by_status['in-progress']} |
| in-review | ${progress.stories.by_status['in-review']} |
| blocked | ${progress.stories.by_status.blocked} |
| completed | ${progress.stories.by_status.completed} |
| pivoted | ${progress.stories.by_status.pivoted} |
| archived | ${progress.stories.by_status.archived} |

---

## Detalle por Épico

${detail}

---

## Riesgo y Cambio

- Bloqueadas sobre activas: ${progress.summary.blocked_pct}%
- Pivotadas sobre histórico: ${progress.summary.pivoted_pct}%
- WIP total: ${progress.summary.wip}

---

## Pivots Registrados

| Pivot | Target | Motivo | Fecha |
|---|---|---|---|
${pivots}
`
}

export function renderProgressMarkdown(config: ProjectConfig, model: BusinessModel, existing: string | null): string {
  const progress = getBusinessProgress(model)
  const notes = manualNotes(
    existing,
    '## Notas del operador',
    '## Notas del operador\n\n<!-- Escribir libremente debajo de esta línea -->\n',
  )

  return `# Progress — Business
> Proyecto: ${config.project}

<!-- AUTO-GENERATED — no editar esta sección manualmente -->
historias_totales: ${progress.summary.total_stories}
historias_activas: ${progress.summary.active_stories}
historias_completadas: ${progress.summary.completed_stories}
historias_bloqueadas: ${progress.stories.blocked}
wip_actual: ${progress.summary.wip}
avance_global: ${progress.summary.progress_pct}%
epicos_totales: ${progress.summary.total_epics}
pivots_registrados: ${progress.pivots}
ultima_actualizacion: ${model.updated_at.split('T')[0]}
<!-- END AUTO-GENERATED -->

${notes}
`
}

export function renderEpicMarkdown(epic: EpicRecord, operator: string): string {
  const stories = epic.stories.length > 0
    ? epic.stories.map((story) =>
      `| ${story.id} | ${story.title} | ${story.priority} | ${formatStoryStatus(story.status)} |`,
    ).join('\n')
    : '| — | Sin historias registradas | — | draft |'

  return `# ${epic.id} — ${epic.title}
> Versión: 1.0.0 · Estado actual: \`${formatEpicStatus(epic.status)}\`
> Creado: ${epic.created_at.split('T')[0]} · Última actualización: ${epic.updated_at.split('T')[0]}

---

## Descripción

${epic.description || '[Qué resuelve para el negocio. Orientado a resultado. 2-5 líneas.]'}

## Alcance Técnico

**Incluye:**
- [funcionalidad 1]
- [funcionalidad 2]

**NO incluye:**
- [funcionalidad excluida — y por qué]

## Entidades Principales

\`\`\`
[Entidad1]
  - campo1: tipo
  - campo2: tipo
\`\`\`

## Dependencias

| Tipo | Referencia | Descripción |
|---|---|---|
| — | — | Ninguna |

## Historias de Usuario

| ID | Historia | Prioridad | Estado |
|---|---|---|---|
${stories}

## Criterio de Completitud

- Todas las historias activas en estado \`completed\`

---

## Changelog

| Versión | Fecha | Autor | Cambio |
|---|---|---|---|
| 1.0.0 | ${epic.created_at.split('T')[0]} | ${operator} | Creación inicial |
`
}

export function renderStoryMarkdown(
  epic: EpicRecord,
  story: StoryRecord,
  operator: string,
): string {
  return `# ${story.id} — ${story.title}
> **Épico:** ${epic.id} · **Versión:** 1.0.0
> **Estado actual:** \`${formatStoryStatus(story.status)}\`
> **Creado:** ${story.created_at.split('T')[0]} · **Última actualización:** ${story.updated_at.split('T')[0]}

---

## Metadatos

| Campo | Valor |
|---|---|
| ID | ${story.id} |
| Épico | ${epic.id} — ${epic.title} |
| Prioridad | \`${story.priority}\` |
| Asignado a | ${story.assignee} |
| Sprint / Ciclo | pendiente |
| Tests relacionados | pendiente |

---

## Historia de Usuario

> Como **${story.role}**, quiero **${story.action}** para **${story.benefit}**.

---

## Contexto

[Por qué existe esta historia. El problema real del cliente. 2-5 líneas.]

---

## Comportamiento Esperado

### Flujo Principal

1. [Paso 1]
2. [Paso 2]
3. [Paso 3]
4. [resultado final]

### Flujos Alternativos

**FA-01 — [Nombre]:**
- Condición: [cuándo ocurre]
- Comportamiento: [qué hace el sistema]

### Reglas de Negocio

- **RN-01:** [regla específica]
- **RN-02:** [regla específica]

---

## Criterios de Aceptación

> Formato Gherkin. Cada criterio es un test verificable.

- [ ] **CA-01:** Dado que [precondición], cuando [acción], entonces [resultado].
- [ ] **CA-02:** Dado que [precondición], cuando [acción], entonces [resultado].
- [ ] **CA-03:** Dado que [error], cuando [acción], entonces [el sistema maneja el error].

---

## Requerimientos No Funcionales

- **Performance:** [ej: < 300ms / "no aplica"]
- **Seguridad:** [ej: JWT requerido / validación de rol]
- **UX:** [ej: feedback visual inmediato / "no aplica"]
- **Validaciones:** [ej: formato de email RFC 5322]

---

## Notas Técnicas

- [patrón de implementación sugerido]
- [decisión previa que afecta esta historia]
- [referencia a otro módulo si hay acoplamiento]

---

## Dependencias

| Tipo | Referencia | Descripción |
|---|---|---|
| — | — | Sin dependencias |

---

## Estimación

| Escenario | Horas |
|---|---|
| Optimista | Xhr |
| Realista | Xhr |
| Pesimista | Xhr |
| **Acordada** | **Xhr** |

---

## Tareas

- [ ] **TK-001** — [descripción técnica] · [responsable]
- [ ] **TK-002** — [descripción técnica] · [responsable]
- [ ] **TK-003** — Tests para CA-01, CA-02 · [responsable]

---

## Changelog

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | ${story.created_at.split('T')[0]} | ${operator} | Creación inicial |
`
}

async function patchFrontMatterLine(filePath: string, pattern: RegExp, replacement: string): Promise<void> {
  if (!await fs.pathExists(filePath)) return

  const content = await fs.readFile(filePath, 'utf-8')
  const updated = content.replace(pattern, replacement)
  if (updated !== content) {
    await fs.writeFile(filePath, updated, 'utf-8')
  }
}

export async function patchStoryMetadata(story: StoryRecord, epicSlug?: string): Promise<void> {
  const storyPath = ensureStoryPath(story.epic_id, story.id, epicSlug, story.slug)
  await patchFrontMatterLine(
    storyPath,
    /> \*\*Estado actual:\*\* `[^`]+`/m,
    `> **Estado actual:** \`${formatStoryStatus(story.status)}\``,
  )
  await patchFrontMatterLine(
    storyPath,
    /> \*\*Creado:\*\* [^·]+ · \*\*Última actualización:\*\* [^\n]+/m,
    `> **Creado:** ${story.created_at.split('T')[0]} · **Última actualización:** ${story.updated_at.split('T')[0]}`,
  )
}

export async function patchEpicMetadata(epic: EpicRecord): Promise<void> {
  const epicPath = ensureEpicPath(epic.id, epic.slug)
  await patchFrontMatterLine(
    epicPath,
    /> Versión: 1\.0\.0 · Estado actual: `[^`]+`/m,
    `> Versión: 1.0.0 · Estado actual: \`${formatEpicStatus(epic.status)}\``,
  )
  await patchFrontMatterLine(
    epicPath,
    /> Creado: [^·]+ · Última actualización: [^\n]+/m,
    `> Creado: ${epic.created_at.split('T')[0]} · Última actualización: ${epic.updated_at.split('T')[0]}`,
  )
}

export async function syncBusinessArtifacts(config: ProjectConfig, model: BusinessModel): Promise<void> {
  const businessDir = path.join(process.cwd(), '.business')
  const requirementsDir = path.join(businessDir, 'requirements')
  const progressPath = path.join(businessDir, 'progress.md')
  const progressJsonPath = path.join(businessDir, 'progress.json')
  const overviewPath = path.join(requirementsDir, 'overview.md')
  const progress = getBusinessProgress(model)

  await fs.ensureDir(requirementsDir)
  await fs.writeFile(overviewPath, renderOverviewMarkdown(config, model), 'utf-8')

  const existingProgress = await fs.pathExists(progressPath)
    ? await fs.readFile(progressPath, 'utf-8')
    : null
  await fs.writeFile(progressPath, renderProgressMarkdown(config, model, existingProgress), 'utf-8')
  await fs.writeJson(progressJsonPath, {
    layer: 'business',
    summary: progress.summary,
    stories: progress.stories,
    epics: progress.epics,
    deploys: 0,
    incidents: 0,
    pivots: progress.pivots,
    last_updated: model.updated_at.split('T')[0],
  }, { spaces: 2 })
}
