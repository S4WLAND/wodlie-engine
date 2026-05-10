/**
 * Adapter: BullMQ (queue sobre Redis)
 *
 * Para proyectos con alto volumen de jobs o múltiples workers.
 * Activar con QUEUE_ADAPTER=redis en .env
 */

import type { QueueAdapter, JobPayload, JobOptions, JobHandler, JobStatus } from './adapter'

export class RedisQueueAdapter implements QueueAdapter {
  // TODO: implementar con BullMQ
  // https://docs.bullmq.io/

  async add(_jobName: string, _payload: JobPayload, _options?: JobOptions): Promise<string> {
    throw new Error('RedisQueueAdapter: implementar con BullMQ')
  }

  async process(_jobName: string, _handler: JobHandler): Promise<void> {
    throw new Error('RedisQueueAdapter: implementar con BullMQ')
  }

  async getJob(_jobId: string): Promise<JobStatus | null> {
    return null
  }
}
