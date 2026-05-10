import { env } from './env'

export const appConfig = {
  name: '{{PROJECT_NAME}}',
  version: '1.0.0',
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
}
