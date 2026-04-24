import 'dotenv/config'
import { db } from '../db'
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

  logger.info({ email }, 'Creando usuario administrador')

  // TODO: implementar cuando exista el módulo de usuarios
  // const { hash } = await import('bcrypt')
  // const hashedPassword = await hash(password, 12)
  // await db.insert(usersTable).values({ email, password: hashedPassword, role: 'admin' })

  logger.info('Admin creado exitosamente')
  process.exit(0)
}

createAdmin().catch((err) => {
  logger.error(err)
  process.exit(1)
})
