import pino, { type Bindings, type LoggerOptions } from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')

const prettyTransport = isDevelopment
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
  }
  : undefined

const loggerOptions: LoggerOptions = {
  level: logLevel,
  base: undefined,
  transport: prettyTransport,
}

export const logger = pino(loggerOptions)

export function createScopedLogger(bindings: Bindings) {
  return logger.child(bindings)
}
