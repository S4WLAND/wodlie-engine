import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '../config/env'

let pool: Pool | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

export function isDatabaseConfigured() {
  return Boolean(env.DATABASE_URL)
}

export function getDb() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está configurada. Configúrala antes de usar persistencia real.')
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
    })
  }

  if (!dbInstance) {
    dbInstance = drizzle(pool)
  }

  return dbInstance
}

export type DB = ReturnType<typeof getDb>
