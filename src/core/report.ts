import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { loadProjectConfig } from './shared/config'
import { ensureCanonicalFiles, getBusinessProgress, loadBusinessModel, readEngineEvents, type StoryRecord } from './shared/canonical'

function getWeekId(): string {
  const d = new Date()
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function getWeekIdForDate(date: Date): string {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function flattenStories(model: Awaited<ReturnType<typeof loadBusinessModel>>): StoryRecord[] {
  return model.epics.flatMap((epic) => epic.stories)
}

export async function reportDraftCommand(): Promise<void> {
  console.log(chalk.bold('\n📝 Report Draft — Generando borrador semanal\n'))

  let config
  try {
    config = await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  await ensureCanonicalFiles(config, new Date().toISOString())
  const model = await loadBusinessModel()
  const progress = getBusinessProgress(model)
  const stories = flattenStories(model)
  const events = await readEngineEvents()
  const currentWeek = getWeekId()
  const completedThisWeek = events
    .filter((event) => event.type === 'business.story.completed')
    .filter((event) => getWeekIdForDate(new Date(event.created_at)) === currentWeek)
    .map((event) => stories.find((story) => story.id === event.entity_id))
    .filter((story): story is StoryRecord => Boolean(story))
  const pivotsThisWeek = events
    .filter((event) => event.type.includes('pivot'))
    .filter((event) => getWeekIdForDate(new Date(event.created_at)) === currentWeek)

  const week = getWeekId()
  const reportDir = path.join(process.cwd(), '.business', 'reports', 'internal')
  const reportPath = path.join(reportDir, `${week}.md`)

  if (await fs.pathExists(reportPath)) {
    console.log(chalk.yellow(`⚠ Ya existe un borrador para ${week}: ${reportPath}`))
    return
  }

  await fs.ensureDir(reportDir)
  const totalStories = progress.stories.total
  const completed = progress.stories.completed
  const inProgress = progress.stories.in_progress
  const globalPct = totalStories > 0 ? Math.round((completed / totalStories) * 100) : 0
  const inProgressStories = stories.filter((story) =>
    ['activo', 'en-desarrollo', 'en-prueba'].includes(story.status),
  )

  const date = new Date().toISOString().split('T')[0]
  const content = `# Informe Semanal Interno — ${week}
> Proyecto: ${config.project}
> Fecha: ${date}

---

## INSTRUCCIONES PARA EL AGENTE IA

Lee este archivo y genera el reporte cliente en \`.business/reports/client/${week}.tex\`.
Transformá el lenguaje técnico a lenguaje de negocio.
No incluyas información interna marcada como "NO INCLUIR".

---

## Resumen de la semana (lenguaje libre)

<!-- Completar: qué pasó esta semana -->

---

## Completado esta semana

${completedThisWeek.length > 0
    ? completedThisWeek.map((story) => `- ${story.id} — ${story.title}`).join('\n')
    : '- (sin historias completadas esta semana)'}

---

## En progreso

${inProgressStories.length > 0
    ? inProgressStories.map((story) => `- ${story.id} — ${story.title} — ${story.status}`).join('\n')
    : '- (sin historias en progreso)'}

---

## Bloqueado / Con problemas

- (ninguno)

---

## Pivotes o cambios

${pivotsThisWeek.length > 0
    ? pivotsThisWeek.map((event) => `- ${event.entity_id ?? 'global'} — ${event.payload.reason ?? 'pivot registrado'}`).join('\n')
    : '- (ninguno)'}

---

## Plan para la próxima semana

- [ ] (completar)

---

## Notas adicionales para el informe cliente

<!-- Completar -->

---

## Datos calculados (el agente los completa)

- Avance global: ${globalPct}%
- Historias completadas: ${completed}/${totalStories}
- Historias en progreso: ${inProgress}
`

  await fs.writeFile(reportPath, content)
  console.log(chalk.green(`✓ Borrador creado: .business/reports/internal/${week}.md`))
  console.log(chalk.dim('\n  Completar secciones y luego ejecutar: wodlie-engine report\n'))
}

export async function reportCommand(): Promise<void> {
  console.log(chalk.bold('\n📄 Report — Generando reporte cliente\n'))

  let config
  try {
    config = await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  await ensureCanonicalFiles(config, new Date().toISOString())
  const model = await loadBusinessModel()
  const progress = getBusinessProgress(model)
  const week = getWeekId()
  const internalPath = path.join(process.cwd(), '.business', 'reports', 'internal', `${week}.md`)

  if (!await fs.pathExists(internalPath)) {
    console.error(chalk.red(`✗ No se encontró el borrador para ${week}`))
    console.error(chalk.dim('  Ejecutá primero: wodlie-engine report:draft'))
    process.exit(1)
  }

  const clientDir = path.join(process.cwd(), '.business', 'reports', 'client')
  await fs.ensureDir(clientDir)
  const texPath = path.join(clientDir, `${week}.tex`)
  const date = new Date().toISOString().split('T')[0]

  const tex = `\\documentclass[a4paper,11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{geometry}
\\geometry{margin=2.5cm}
\\usepackage{parskip}

\\title{Informe Semanal --- ${config.project}\\\\\\large Semana ${week}}
\\date{${date}}
\\author{Wodlie}

\\begin{document}
\\maketitle

% Generado por wodlie-engine. Revisar antes de enviar al cliente.
% El agente IA debe procesar el informe interno y completar las secciones.

\\section*{Resumen Ejecutivo}
% Completar desde: Resumen de la semana

\\section*{Avances de la Semana}
% Completar desde: Completado esta semana

\\section*{Estado Actual}
Avance global estimado: ${progress.stories.total > 0 ? Math.round((progress.stories.completed / progress.stories.total) * 100) : 0}\\%.

\\section*{Próximas Acciones}
% Completar desde: Plan para la próxima semana

\\end{document}
`

  await fs.writeFile(texPath, tex)
  console.log(chalk.green(`✓ Template .tex generado: .business/reports/client/${week}.tex`))
  console.log(chalk.dim('\n  Procesar con agente IA y compilar: pdflatex .business/reports/client/' + week + '.tex\n'))
}
