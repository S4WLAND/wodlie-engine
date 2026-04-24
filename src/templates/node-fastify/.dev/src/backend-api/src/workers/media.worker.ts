import 'dotenv/config'
import { logger } from '../shared/logger'

logger.info('Worker de media iniciado')

// TODO: implementar procesamiento de archivos media
// Patrones: resize de imágenes, generación de thumbnails, conversión de formatos
// Queue: escuchar jobs de tipo 'process-media', 'resize-image', 'generate-thumbnail'

async function start() {
  logger.info('Worker media esperando jobs...')
  // const queue = await createQueueAdapter()
  // await queue.process('process-media', async (payload) => {
  //   logger.info({ payload }, 'Procesando media')
  // })
}

start().catch((err) => {
  logger.error(err, 'Error fatal en worker media')
  process.exit(1)
})
