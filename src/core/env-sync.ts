import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { spawn } from 'node:child_process'
import { loadProjectConfig } from './shared/config'

function parseEnvFile(content: string): Map<string, string> {
  const vars = new Map<string, string>()
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.substring(0, eqIdx).trim()
    const val = trimmed.substring(eqIdx + 1).trim()
    if (key) vars.set(key, val)
  }
  return vars
}

async function runProjectEnvScript(scriptPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, 'env', 'sync'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
    })

    child.on('error', reject)
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

async function syncEnvFile(examplePath: string, targetPath: string, label: string): Promise<void> {
  if (!await fs.pathExists(examplePath)) return

  const exampleContent = await fs.readFile(examplePath, 'utf-8')
  const exampleVars = parseEnvFile(exampleContent)

  if (!await fs.pathExists(targetPath)) {
    await fs.copy(examplePath, targetPath)
    console.log(chalk.green(`  ✓ Creado ${label}`))
    return
  }

  const targetContent = await fs.readFile(targetPath, 'utf-8')
  const targetVars = parseEnvFile(targetContent)

  const newKeys: string[] = []
  const removedKeys: string[] = []

  for (const key of exampleVars.keys()) {
    if (!targetVars.has(key)) newKeys.push(key)
  }
  for (const key of targetVars.keys()) {
    if (!exampleVars.has(key)) removedKeys.push(key)
  }

  if (newKeys.length > 0) {
    let appended = '\n# Claves nuevas — completar antes de deploy\n'
    for (const key of newKeys) {
      appended += `${key}=\n`
    }
    await fs.appendFile(targetPath, appended)
    console.log(chalk.green(`  ✓ ${label}: ${newKeys.length} clave(s) nueva(s) agregada(s)`))
    for (const key of newKeys) console.log(chalk.cyan(`    + ${key}`))
  } else {
    console.log(chalk.dim(`  ✓ ${label}: sin cambios`))
  }

  if (removedKeys.length > 0) {
    console.log(chalk.yellow(`  ⚠ ${label}: ${removedKeys.length} clave(s) en target no están en .env.example:`))
    for (const key of removedKeys) console.log(chalk.yellow(`    - ${key}`))
  }
}

export async function envSyncCommand(): Promise<void> {
  const projectEnvScript = path.join(process.cwd(), '.infra', 'scripts', 'env', 'index.mjs')

  if (await fs.pathExists(projectEnvScript)) {
    console.log(chalk.bold('\n🔐 Env Sync — Delegando a .infra/scripts/env/index.mjs\n'))
    const exitCode = await runProjectEnvScript(projectEnvScript)
    if (exitCode !== 0) {
      process.exit(exitCode)
    }
    return
  }

  console.log(chalk.bold('\n🔐 Env Sync — Sincronizando variables de entorno\n'))

  let config
  try {
    config = await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  const cwd = process.cwd()
  const apps = [
    { example: '.dev/src/backend-api/.env.example', target: '.dev/src/backend-api/.env.development', label: 'backend-api' },
    { example: '.dev/src/frontend-public/.env.example', target: '.dev/src/frontend-public/.env.development', label: 'frontend-public' },
    { example: '.dev/src/frontend-admin/.env.example', target: '.dev/src/frontend-admin/.env.development', label: 'frontend-admin' },
  ]

  for (const app of apps) {
    await syncEnvFile(
      path.join(cwd, app.example),
      path.join(cwd, app.target),
      app.label,
    )
  }

  const backendEnvPath = path.join(cwd, '.dev', 'src', 'backend-api', '.env.development')
  if (await fs.pathExists(backendEnvPath)) {
    const backendContent = await fs.readFile(backendEnvPath, 'utf-8')
    let extra = ''
    if (config.infra_details?.ssh_host && !backendContent.match(/^SSH_HOST=/m)) {
      extra += `SSH_HOST=${config.infra_details.ssh_host}\n`
    }
    if (config.infra_details?.ssh_user && !backendContent.match(/^SSH_USER=/m)) {
      extra += `SSH_USER=${config.infra_details.ssh_user}\n`
    }
    if (extra) {
      await fs.appendFile(backendEnvPath, `\n# Infra importada desde project.json\n${extra}`)
      console.log(chalk.green('  ✓ backend-api: SSH_HOST / SSH_USER importados desde infra del proyecto'))
    }
  }

  console.log(chalk.bold('\n✓ Sync completado'))
  console.log(chalk.dim('  Revisar y completar valores vacíos antes de deploy\n'))
}
