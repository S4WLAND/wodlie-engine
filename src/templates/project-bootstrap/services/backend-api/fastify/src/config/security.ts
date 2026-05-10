import { env } from './env'

export const securityConfig = {
  jwt: {
    secret: env.JWT_SECRET,
  },
  cors: {
    origins: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  },
  rateLimit: {
    max: 100,
    timeWindow: '1 minute',
  },
}
