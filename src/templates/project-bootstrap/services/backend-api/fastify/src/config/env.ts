import { z } from 'zod'

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .pipe(z.string().url().optional())

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().optional(),
  JWT_SECRET: z.string().min(1).default('dev-jwt-secret-change-me'),
  DATABASE_URL: optionalUrlSchema,
  QUEUE_ADAPTER: z.enum(['graphile', 'redis']).default('graphile'),
  CACHE_ADAPTER: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: optionalUrlSchema,
  ALLOWED_ORIGINS: z.string().default('http://localhost:3001,http://localhost:3002'),
})

const normalizedEnv = {
  ...process.env,
  JWT_SECRET: process.env.JWT_SECRET?.trim() ? process.env.JWT_SECRET.trim() : undefined,
}

const parsed = envSchema.safeParse(normalizedEnv)

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_SECRET === 'dev-jwt-secret-change-me') {
  console.error('Variables de entorno inválidas: { JWT_SECRET: [ "Se requiere un valor real en producción" ] }')
  process.exit(1)
}

export const env = parsed.data
