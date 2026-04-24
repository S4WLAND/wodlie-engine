import fs from 'fs-extra'
import path from 'path'

interface ChangelogEntry {
  date: string
  layer: 'business' | 'infra' | 'dev' | 'core'
  type: string
  description: string
  operator: string
  impact: string[]
  stories_affected: string[]
}

export async function appendLayerChangelog(entry: ChangelogEntry): Promise<void> {
  const jsonPath = path.join(process.cwd(), `.${entry.layer}`, 'changelog.json')
  const mdPath = path.join(process.cwd(), `.${entry.layer}`, 'changelog.md')

  if (await fs.pathExists(jsonPath)) {
    const current = await fs.readJson(jsonPath)
    const changelog = Array.isArray(current.changelog) ? current.changelog : []
    changelog.unshift({
      version: '1.0.0',
      date: entry.date,
      layer: entry.layer,
      type: entry.type,
      description: entry.description,
      operator: entry.operator,
      impact: entry.impact,
      stories_affected: entry.stories_affected,
    })
    await fs.writeJson(jsonPath, { changelog }, { spaces: 2 })
  }

  if (await fs.pathExists(mdPath)) {
    const current = await fs.readFile(mdPath, 'utf-8')
    const block = `### [${entry.date}] — v1.0.0 — ${entry.type}
**Autor:** ${entry.operator}
**Afecta:** ${entry.impact.join(', ') || 'Global'}
**Descripción:** ${entry.description}
**Solicitado por:** engine

---
`

    const marker = '<!-- Nuevas entradas ARRIBA de esta línea'
    const updated = current.includes(marker)
      ? current.replace(marker, `${block}${marker}`)
      : `${current.trim()}\n\n${block}`
    await fs.writeFile(mdPath, updated, 'utf-8')
  }
}
