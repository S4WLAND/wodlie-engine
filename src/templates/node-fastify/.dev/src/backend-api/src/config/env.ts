import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  APP_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  DATABASE_URL: z.string().url(),
  QUEUE_ADAPTER: z.enum(['graphile', 'redis']).default('graphile'),
  CACHE_ADAPTER: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3001,http://localhost:3002'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
