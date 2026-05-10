/**
 * Adapter: Graphile Worker (queue sobre PostgreSQL)
 *
 * Default para proyectos sin Redis.
 * Usa la misma DB de PostgreSQL del proyecto.
 * Migración a Redis: cambiar QUEUE_ADAPTER=redis en .env
 */

import type { QueueAdapter, JobPayload, JobOptions, JobHandler, JobStatus } from './adapter'

export class GraphileQueueAdapter implements QueueAdapter {
  // TODO: implementar con graphile-worker
  // https://worker.graphile.org/

  async add(jobName: string, payload: JobPayload, _options?: JobOptions): Promise<string> {
    // await addJob(jobName, payload, options)
    throw new Error('GraphileQueueAdapter: implementar con graphile-worker')
  }

  async process(jobName: string, _handler: JobHandler): Promise<void> {
    // await run({ taskList: { [jobName]: handler } })
    throw new Error('GraphileQueueAdapter: implementar con graphile-worker')
  }

  async getJob(_jobId: string): Promise<JobStatus | null> {
    return null
  }
}
