import 'dotenv/config'
import { logger } from '../shared/logger'

logger.info('Worker de notificaciones iniciado')

// TODO: implementar envío de notificaciones
// Canales: email (SMTP), WhatsApp Business API, ntfy
// Queue: escuchar jobs de tipo 'send-email', 'send-whatsapp', 'send-push'

async function start() {
  logger.info('Worker notificaciones esperando jobs...')
  // const queue = await createQueueAdapter()
  // await queue.process('send-email', async (payload) => {
  //   logger.info({ payload }, 'Enviando email')
  // })
}

start().catch((err) => {
  logger.error(err, 'Error fatal en worker notificaciones')
  process.exit(1)
})
