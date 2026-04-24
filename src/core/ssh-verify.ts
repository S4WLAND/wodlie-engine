import chalk from 'chalk'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs-extra'
import path from 'path'
import { loadProjectConfig } from './shared/config'

const execAsync = promisify(exec)

export async function sshVerifyCommand(): Promise<void> {
  console.log(chalk.bold('\n🔑 SSH Verify — Verificando conexión SSH\n'))

  try {
    await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  const envPath = path.join(process.cwd(), '.dev', 'src', 'backend-api', '.env.development')

  if (!await fs.pathExists(envPath)) {
    console.error(chalk.red('✗ No se encontró .env.development'))
    console.error(chalk.dim('  Ejecutá: wodlie env:sync'))
    process.exit(1)
  }

  const envContent = await fs.readFile(envPath, 'utf-8')
  const sshHostMatch = envContent.match(/^SSH_HOST=(.+)$/m)
  const sshUserMatch = envContent.match(/^SSH_USER=(.+)$/m)

  if (!sshHostMatch || !sshUserMatch) {
    console.log(chalk.yellow('⚠ SSH_HOST o SSH_USER no configurados en .env.development'))
    console.log(chalk.dim('  Agregar al .env.development:'))
    console.log(chalk.dim('  SSH_HOST=<ip-del-vps>'))
    console.log(chalk.dim('  SSH_USER=deploy'))
    return
  }

  const host = sshHostMatch[1].trim()
  const user = sshUserMatch[1].trim()

  console.log(chalk.cyan(`→ Verificando: ${user}@${host}\n`))

  try {
    const { stdout } = await execAsync(
      `ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new ${user}@${host} "echo OK"`,
      { timeout: 10000 }
    )
    if (stdout.trim() === 'OK') {
      console.log(chalk.green(`✓ Conexión SSH exitosa: ${user}@${host}`))
    }
  } catch (err: unknown) {
    const error = err as { message?: string }
    console.error(chalk.red(`✗ No se pudo conectar: ${error.message}`))
    console.log(chalk.dim('\n  Verificar:'))
    console.log(chalk.dim('  1. Clave SSH en ~/.ssh/authorized_keys del VPS'))
    console.log(chalk.dim('  2. Puerto SSH accesible (default 22)'))
    console.log(chalk.dim('  3. Firewall permite conexión SSH'))
  }

  console.log('')
}
