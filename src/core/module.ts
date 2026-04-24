import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { loadProjectConfig } from './shared/config'

interface ModuleAddOptions {
  from?: string
}

export async function moduleAddCommand(nombre: string, options: ModuleAddOptions): Promise<void> {
  console.log(chalk.bold(`\n📦 Module Add — ${nombre}\n`))

  try {
    await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  if (!options.from) {
    console.error(chalk.red('✗ Especificar origen con --from <ruta>'))
    process.exit(1)
  }

  const srcModule = path.resolve(options.from, '.dev', 'src', 'backend-api', 'src', 'modules', nombre)

  if (!await fs.pathExists(srcModule)) {
    console.error(chalk.red(`✗ No se encontró el módulo '${nombre}' en ${options.from}`))
    console.error(chalk.dim(`  Buscado en: ${srcModule}`))
    process.exit(1)
  }

  const destModule = path.join(process.cwd(), '.dev', 'src', 'backend-api', 'src', 'modules', nombre)

  if (await fs.pathExists(destModule)) {
    console.error(chalk.red(`✗ El módulo '${nombre}' ya existe en este proyecto`))
    process.exit(1)
  }

  console.log(chalk.cyan(`→ Copiando módulo desde ${options.from}...`))
  await fs.copy(srcModule, destModule)
  console.log(chalk.green(`  ✓ Módulo copiado a .dev/src/backend-api/src/modules/${nombre}`))

  console.log(chalk.yellow('\n⚠ Acción manual requerida:'))
  console.log(chalk.dim(`  1. Revisar y adaptar el módulo al contexto de este proyecto`))
  console.log(chalk.dim(`  2. Registrar en .dev/src/backend-api/src/app.ts:`))
  console.log(chalk.dim(`     await app.register(import('./modules/${nombre}'), { prefix: '/api/${nombre}' })`))
  console.log(chalk.dim(`  3. Agregar migraciones de DB si hay cambios de schema`))
  console.log(chalk.dim(`  4. Commit: feat(dev/${nombre}): acoplar módulo desde ${path.basename(options.from)}`))
  console.log('')
}

export async function moduleRemoveCommand(nombre: string): Promise<void> {
  console.log(chalk.bold(`\n📦 Module Remove — ${nombre}\n`))

  try {
    await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  const modulePath = path.join(process.cwd(), '.dev', 'src', 'backend-api', 'src', 'modules', nombre)

  if (!await fs.pathExists(modulePath)) {
    console.error(chalk.red(`✗ Módulo '${nombre}' no encontrado`))
    process.exit(1)
  }

  const readmePath = path.join(modulePath, 'README.md')
  if (await fs.pathExists(readmePath)) {
    const readme = await fs.readFile(readmePath, 'utf-8')
    console.log(chalk.dim('\n  README del módulo:'))
    console.log(chalk.dim('  ' + readme.split('\n').slice(0, 5).join('\n  ')))
  }

  console.log(chalk.yellow('\n⚠ MODO PLAN — Acción manual requerida antes de eliminar:'))
  console.log(chalk.dim(`  1. Buscar referencias: grep -r "${nombre}" .dev/src/`))
  console.log(chalk.dim(`  2. Eliminar de app.ts el registro del módulo`))
  console.log(chalk.dim(`  3. Generar migración: npm run db:generate`))
  console.log(chalk.dim(`  4. Eliminar carpeta: rm -rf .dev/src/backend-api/src/modules/${nombre}`))
  console.log(chalk.dim(`  5. Commit: chore(dev/${nombre}): remover módulo`))
  console.log('')
}
