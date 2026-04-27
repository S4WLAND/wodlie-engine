#!/usr/bin/env node
import { Command } from 'commander'
import { runInteractiveShell } from './shell'

async function main(): Promise<void> {
  const program = new Command()
  program
    .name('wodlie-engine')
    .description('Wodlie SDLC Framework')
    .version('1.0.0')

  program.command('init <proyecto>')
    .description('Crea un proyecto nuevo')
    .option('--type <tipo>', 'webapp|platform|enterprise|iot', 'webapp')
    .option('--size <tamaño>', 'small|medium|large', 'medium')
    .option('--stack <stack>', 'node|python|go', 'node')
    .option('--capabilities <caps>', 'ai,automation,native,realtime,media')
    .option('--infra <infra>', 'vps|hosting|cloud', 'vps')
    .action(async (proyecto, options) => {
      const { initCommand } = await import('../core/init')
      await initCommand(proyecto, options)
    })

  program.command('status')
    .description('Sincroniza estado, métricas y artefactos')
    .action(async () => {
      const { statusCommand } = await import('../core/status')
      await statusCommand()
    })

  program.command('health')
    .description('Muestra el dashboard de salud del proyecto')
    .action(async () => {
      const { healthCommand } = await import('../core/health')
      await healthCommand()
    })

  program.command('infra:edit')
    .description('Edita la ficha técnica de infraestructura y regenera la documentación')
    .action(async () => {
      const { infraEditCommand } = await import('../core/infra')
      await infraEditCommand()
    })

  program.command('infra:sync')
    .description('Regenera la documentación de infraestructura desde project.json')
    .action(async () => {
      const { infraSyncCommand } = await import('../core/infra')
      await infraSyncCommand()
    })

  program.command('business:epic:create <title>')
    .description('Crea un épico con ID autogenerado')
    .option('--description <text>')
    .action(async (title, options) => {
      const { businessEpicCreateAutoCommand } = await import('../core/business')
      await businessEpicCreateAutoCommand(title, options)
    })

  program.command('business:epic:list')
    .description('Lista épicos canónicos')
    .action(async () => {
      const { listEpicsCommand } = await import('../core/business')
      const epics = await listEpicsCommand()
      for (const epic of epics) {
        console.log(`${epic.id}\t${epic.status}\t${epic.title}`)
      }
    })

  program.command('business:epic:edit <epicId>')
    .description('Edita un épico')
    .option('--title <text>')
    .option('--description <text>')
    .action(async (epicId, options) => {
      const { businessEpicEditCommand } = await import('../core/business')
      await businessEpicEditCommand(epicId, options)
    })

  program.command('business:epic:status <epicId> <status>')
    .description('Actualiza el estado de un épico')
    .action(async (epicId, status) => {
      const { businessEpicStatusCommand } = await import('../core/business')
      await businessEpicStatusCommand(epicId, status)
    })

  program.command('business:story:create <epicId> <title>')
    .description('Crea una historia con ID autogenerado')
    .option('--as <role>')
    .option('--want <action>')
    .option('--so-that <benefit>')
    .option('--priority <priority>', 'alta|media|baja', 'media')
    .option('--assignee <name>', 'Responsable', 'sin asignar')
    .action(async (epicId, title, options) => {
      const { businessStoryCreateAutoCommand } = await import('../core/business')
      await businessStoryCreateAutoCommand(epicId, title, options)
    })

  program.command('business:story:list')
    .description('Lista historias canónicas')
    .action(async () => {
      const { listStoriesCommand } = await import('../core/business')
      const stories = await listStoriesCommand()
      for (const { epic, story } of stories) {
        console.log(`${story.id}\t${story.status}\t${epic.id}\t${story.title}`)
      }
    })

  program.command('business:story:edit <storyId>')
    .description('Edita una historia')
    .option('--title <text>')
    .option('--as <role>')
    .option('--want <action>')
    .option('--so-that <benefit>')
    .option('--priority <priority>')
    .option('--assignee <name>')
    .action(async (storyId, options) => {
      const { businessStoryEditCommand } = await import('../core/business')
      await businessStoryEditCommand(storyId, options)
    })

  program.command('business:story:status <storyId> <status>')
    .description('Actualiza el estado canónico de una historia')
    .action(async (storyId, status) => {
      const { businessStoryStatusCommand } = await import('../core/business')
      await businessStoryStatusCommand(storyId, status)
    })

  program.command('business:pivot <targetId>')
    .description('Registra un pivot sobre el proyecto, un épico o una historia')
    .option('--reason <text>')
    .action(async (targetId, options) => {
      const { businessPivotCommand } = await import('../core/business')
      await businessPivotCommand(targetId, options)
    })

  program.command('business:sync')
    .description('Reconstruye overview y métricas desde business.json')
    .action(async () => {
      const { businessSyncCommand } = await import('../core/business')
      await businessSyncCommand()
    })

  program.command('dev:story:complete <storyId>')
    .description('Marca una historia como completada desde DEV y sincroniza negocio')
    .action(async (storyId) => {
      const { devStoryCompleteCommand } = await import('../core/business')
      await devStoryCompleteCommand(storyId)
    })

  program.command('report:draft')
    .description('Genera el borrador interno de la semana')
    .action(async () => {
      const { reportDraftCommand } = await import('../core/report')
      await reportDraftCommand()
    })

  program.command('report')
    .description('Genera el template .tex para cliente')
    .action(async () => {
      const { reportCommand } = await import('../core/report')
      await reportCommand()
    })

  program.command('env:sync').action(async () => { const { envSyncCommand } = await import('../core/env-sync'); await envSyncCommand() })
  program.command('module:add <nombre>').option('--from <ruta>').action(async (nombre, options) => { const { moduleAddCommand } = await import('../core/module'); await moduleAddCommand(nombre, options) })
  program.command('module:remove <nombre>').action(async (nombre) => { const { moduleRemoveCommand } = await import('../core/module'); await moduleRemoveCommand(nombre) })
  program.command('trigger <nombre>').option('--project <proyecto>').option('--story <id>').option('--epic <id>').action(async (nombre, options) => { const { triggerCommand } = await import('../core/trigger'); await triggerCommand(nombre, options) })
  program.command('deploy').option('--env <entorno>', 'staging|production', 'staging').option('--target <target>', 'front|admin|api|worker|all', 'all').option('--skip <items>').action(async (options) => { const { deployCommand } = await import('../core/deploy'); await deployCommand(options) })
  program.command('ssh:verify').action(async () => { const { sshVerifyCommand } = await import('../core/ssh-verify'); await sshVerifyCommand() })
  program.command('export').action(async () => { const { exportCommand } = await import('../core/export'); await exportCommand() })
  program.command('purge').action(async () => { const { purgeCommand } = await import('../core/purge'); await purgeCommand() })
  program.command('deliver').option('--target <url>').action(async (options) => { const { deliverCommand } = await import('../core/deliver'); await deliverCommand(options) })
  program.command('reimport').option('--from <url>').option('--apply').action(async (options) => { const { reimportCommand } = await import('../core/reimport'); await reimportCommand(options) })
  program.command('upgrade').option('--apply').action(async (options) => { const { upgradeCommand } = await import('../core/upgrade'); await upgradeCommand(options) })
  program.command('reconcile').description('Sincroniza artefactos derivados con el modelo canónico').action(async () => { const { reconcileCommand } = await import('../core/business'); await reconcileCommand() })

  if (process.argv.length <= 2) {
    await runInteractiveShell()
    return
  }

  await program.parseAsync(process.argv)
}

void main()
