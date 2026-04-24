import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { loadProjectConfig } from './shared/config'
import { createStateAdapter } from '../adapters/state/adapter'

export async function exportCommand(): Promise<void> {
  console.log(chalk.bold('\n📦 Export — Generando exportación del proyecto\n'))

  let config
  try {
    config = await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  const date = new Date().toISOString().split('T')[0]
  const exportDir = path.join(process.cwd(), '.wodlie-export')
  await fs.ensureDir(path.join(exportDir, 'state'))
  await fs.ensureDir(path.join(exportDir, 'changelog'))
  await fs.ensureDir(path.join(exportDir, 'metrics'))
  await fs.ensureDir(path.join(exportDir, 'snapshots'))
  await fs.ensureDir(path.join(exportDir, 'delivery'))

  // Copiar state.json final
  const stateAdapter = await createStateAdapter()
  const state = await stateAdapter.read()
  if (state) {
    await fs.writeJson(path.join(exportDir, 'state', 'final-state.json'), state, { spaces: 2 })
    console.log(chalk.green('  ✓ state/final-state.json'))
  }

  // Copiar changelogs de todas las capas
  const changelogData: Record<string, unknown[]> = {}
  for (const layer of ['core', 'business', 'infra', 'dev']) {
    const clPath = path.join(process.cwd(), `.${layer}`, 'changelog.json')
    if (await fs.pathExists(clPath)) {
      const data = await fs.readJson(clPath)
      changelogData[layer] = data.changelog ?? []
    }
  }
  await fs.writeJson(path.join(exportDir, 'changelog', 'full-changelog.json'), changelogData, { spaces: 2 })
  console.log(chalk.green('  ✓ changelog/full-changelog.json'))

  // Métricas
  const metrics: Record<string, unknown> = {}
  for (const layer of ['business', 'infra', 'dev']) {
    const pPath = path.join(process.cwd(), `.${layer}`, 'progress.json')
    if (await fs.pathExists(pPath)) {
      metrics[layer] = await fs.readJson(pPath)
    }
  }
  await fs.writeJson(path.join(exportDir, 'metrics', 'history.json'), metrics, { spaces: 2 })
  console.log(chalk.green('  ✓ metrics/history.json'))

  // Snapshot con fecha
  const snapshot = { date, project: config.project, state, metrics }
  await fs.writeJson(path.join(exportDir, 'snapshots', `${date}.json`), snapshot, { spaces: 2 })
  console.log(chalk.green(`  ✓ snapshots/${date}.json`))

  // README del export
  const readme = `# Wodlie Export — ${config.project}
> Generado: ${date}

## Contenido

- \`state/final-state.json\` — Estado final del proyecto
- \`changelog/full-changelog.json\` — Changelog completo por capa
- \`metrics/history.json\` — Métricas finales por capa
- \`snapshots/${date}.json\` — Snapshot del día de entrega
- \`delivery/delivery-report.md\` — Informe de entrega

## Generado por wodlie-engine v1.0.0
`
  await fs.writeFile(path.join(exportDir, 'README.md'), readme)

  // Reporte de entrega
  const deliveryReport = `# Informe de Entrega — ${config.project}
> Fecha: ${date}

## Resumen del proyecto

Proyecto completado. Ver state/final-state.json para métricas finales.

## Archivos entregados

- Código fuente en .dev/src/
- Documentación en .business/, .infra/
- Infraestructura en .infra/vps/docker-compose/

## Notas de entrega

[Completar antes de entregar al cliente]
`
  await fs.writeFile(path.join(exportDir, 'delivery', 'delivery-report.md'), deliveryReport)
  console.log(chalk.green('  ✓ delivery/delivery-report.md'))

  console.log(chalk.bold(`\n✓ Export completado en .wodlie-export/\n`))
}
