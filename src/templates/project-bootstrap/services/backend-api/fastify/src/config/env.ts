import { z } from 'zod'

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .pipe(z.string().url().optional())

const optionalStringSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))

const booleanishSchema = z
  .union([z.string(), z.boolean(), z.undefined()])
  .transform((value) => {
    if (typeof value === 'boolean') return value
    if (typeof value !== 'string') return undefined

    const normalized = value.trim().toLowerCase()

    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false

    return undefined
  })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  HTTP2_ENABLED: booleanishSchema.pipe(z.boolean().optional()).default(false),
  LOG_LEVEL: z.string().optional(),
  JWT_SECRET: z.string().min(1).default('dev-jwt-secret-change-me'),
  DATABASE_URL: optionalUrlSchema,
  QUEUE_ADAPTER: z.enum(['graphile', 'redis']).default('graphile'),
  CACHE_ADAPTER: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: optionalUrlSchema,
  ALLOWED_ORIGINS: z.string().default('http://localhost:3001,http://localhost:3002'),
  BACKEND_PUBLIC_URL: optionalUrlSchema,
  FRONTEND_PUBLIC_URL: optionalUrlSchema,
  FRONTEND_ADMIN_URL: optionalUrlSchema,
  AUTH_COOKIE_DOMAIN: optionalStringSchema,
  AUTH_COOKIE_SECURE: booleanishSchema.pipe(z.boolean().optional()).default(false),
  AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  AUTH_ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  AUTH_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  AUTH_REAUTH_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  AUTH_EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().int().positive().default(24),
  AUTH_PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
  AUTH_INVITATION_TTL_HOURS: z.coerce.number().int().positive().default(72),
  AUTH_EMAIL_VERIFICATION_ENABLED: booleanishSchema.pipe(z.boolean().optional()).default(false),
  AUTH_PASSWORD_RESET_ENABLED: booleanishSchema.pipe(z.boolean().optional()).default(false),
  AUTH_OAUTH_GOOGLE_ENABLED: booleanishSchema.pipe(z.boolean().optional()).default(false),
  AUTH_OAUTH_MICROSOFT_ENABLED: booleanishSchema.pipe(z.boolean().optional()).default(false),
  AUTH_COOKIE_ACCESS_NAME: z.string().default('app_access_token'),
  AUTH_COOKIE_REFRESH_NAME: z.string().default('app_refresh_token'),
  AUTH_COOKIE_CSRF_NAME: z.string().default('app_csrf_token'),
  AUTH_COOKIE_OAUTH_STATE_NAME: z.string().default('app_oauth_state'),
  AUTH_COOKIE_OAUTH_VERIFIER_NAME: z.string().default('app_oauth_verifier'),
  AUTH_COOKIE_OAUTH_CONTEXT_NAME: z.string().default('app_oauth_context'),
  AUTH_MAIL_TRANSPORT: z.enum(['log', 'smtp']).default('log'),
  AUTH_MAIL_FROM: optionalStringSchema,
  SMTP_HOST: optionalStringSchema,
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: optionalStringSchema,
  SMTP_PASSWORD: optionalStringSchema,
  GOOGLE_OAUTH_CLIENT_ID: optionalStringSchema,
  GOOGLE_OAUTH_CLIENT_SECRET: optionalStringSchema,
  GOOGLE_OAUTH_REDIRECT_URI: optionalUrlSchema,
  MICROSOFT_OAUTH_CLIENT_ID: optionalStringSchema,
  MICROSOFT_OAUTH_CLIENT_SECRET: optionalStringSchema,
  MICROSOFT_OAUTH_TENANT_ID: optionalStringSchema,
  MICROSOFT_OAUTH_REDIRECT_URI: optionalUrlSchema,
  SWAGGER_ENABLED: booleanishSchema.pipe(z.boolean().optional()).default(true),
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
