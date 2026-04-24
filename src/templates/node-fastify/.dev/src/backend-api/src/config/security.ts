import { env } from './env'

export const securityConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    origins: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  },
  rateLimit: {
    max: 100,
    timeWindow: '1 minute',
  },
}
