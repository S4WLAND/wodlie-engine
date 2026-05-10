import 'dotenv/config'
import { logger } from '../shared/logger'

// Uso: tsx src/cli/create-admin.ts --email admin@ejemplo.com --password secret
async function createAdmin() {
  const args = process.argv.slice(2)
  const emailIdx = args.indexOf('--email')
  const passwordIdx = args.indexOf('--password')

  if (emailIdx === -1 || passwordIdx === -1) {
    console.error('Uso: tsx src/cli/create-admin.ts --email <email> --password <password>')
    process.exit(1)
  }

  const email = args[emailIdx + 1]
  const password = args[passwordIdx + 1]

  if (!email || !password) {
    console.error('Email y password son requeridos')
    process.exit(1)
  }

  logger.warn(
    { email },
    'create-admin es un placeholder. Implementa el módulo auth/users antes de habilitar este comando.',
  )
  process.exit(1)
}

createAdmin().catch((err) => {
  logger.error(err)
  process.exit(1)
})
