import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { loadProjectConfig } from './shared/config'
import { statusCommand } from './status'
import { businessPivotCommand, businessStoryStatusCommand } from './business'
import { appendEngineEvent } from './shared/canonical'

interface TriggerOptions {
  project?: string
  story?: string
  epic?: string
}

const VALID_TRIGGERS = ['on-deploy', 'on-incident', 'on-milestone', 'on-pivot']

export async function triggerCommand(nombre: string, options: TriggerOptions): Promise<void> {
  console.log(chalk.bold(`\n⚡ Trigger — ${nombre}\n`))

  if (!VALID_TRIGGERS.includes(nombre)) {
    console.error(chalk.red(`✗ Trigger desconocido: ${nombre}`))
    console.error(chalk.dim(`  Disponibles: ${VALID_TRIGGERS.join(', ')}`))
    process.exit(1)
  }

  try {
    await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  const triggerFile = path.join(process.cwd(), '.core', 'triggers', `${nombre}.yml`)
  if (!await fs.pathExists(triggerFile)) {
    console.error(chalk.red(`✗ No se encontró ${triggerFile}`))
    process.exit(1)
  }

  const date = new Date().toISOString().split('T')[0]
  const time = new Date().toTimeString().split(' ')[0]

  console.log(chalk.cyan(`→ Ejecutando trigger: ${nombre}`))
  if (options.story) console.log(chalk.dim(`  Historia: ${options.story}`))
  if (options.epic) console.log(chalk.dim(`  Épico: ${options.epic}`))

  switch (nombre) {
    case 'on-deploy': {
      await statusCommand()
      await appendEngineEvent({
        type: 'infra.deploy.completed',
        layer: 'infra',
        source: 'system',
        entity: 'deploy',
        entity_id: null,
        payload: { project: options.project ?? null },
      })
      const statePath = path.join(process.cwd(), '.core', 'state.json')
      if (await fs.pathExists(statePath)) {
        const state = await fs.readJson(statePath)
        state.last_deploy = `${date} ${time}`
        await fs.writeJson(statePath, state, { spaces: 2 })
        console.log(chalk.green(`  ✓ last_deploy actualizado: ${date} ${time}`))
      }
      break
    }
    case 'on-incident': {
      await statusCommand()
      await appendEngineEvent({
        type: 'infra.incident.registered',
        layer: 'infra',
        source: 'system',
        entity: 'incident',
        entity_id: null,
        payload: { project: options.project ?? null },
      })
      const statePath = path.join(process.cwd(), '.core', 'state.json')
      if (await fs.pathExists(statePath)) {
        const state = await fs.readJson(statePath)
        state.last_incident = `${date} ${time}`
        await fs.writeJson(statePath, state, { spaces: 2 })
        console.log(chalk.red(`  ⚠ Incidente registrado: ${date} ${time}`))
      }
      break
    }
    case 'on-milestone': {
      if (options.story) {
        await businessStoryStatusCommand(options.story, 'completado')
        console.log(chalk.green(`  ✓ Milestone registrado: ${options.story}`))
      }
      await statusCommand()
      break
    }
    case 'on-pivot': {
      await businessPivotCommand(options.epic ?? 'global', { reason: 'Pivot registrado via trigger' })
      await statusCommand()
      break
    }
  }

  console.log(chalk.green(`\n✓ Trigger ${nombre} completado — ${date} ${time}\n`))
}
