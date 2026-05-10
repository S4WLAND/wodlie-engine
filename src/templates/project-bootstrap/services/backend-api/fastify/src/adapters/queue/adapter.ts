/**
 * Adapter: Queue de trabajos async
 *
 * QUEUE_ADAPTER=graphile → Graphile Worker sobre PostgreSQL (default)
 * QUEUE_ADAPTER=redis    → BullMQ sobre Redis
 *
 * Migración: cambiar QUEUE_ADAPTER en .env → sin cambios en código
 */

export interface JobPayload {
  [key: string]: unknown
}

export interface QueueAdapter {
  add(jobName: string, payload: JobPayload, options?: JobOptions): Promise<string>
  process(jobName: string, handler: JobHandler): Promise<void>
  getJob(jobId: string): Promise<JobStatus | null>
}

export interface JobOptions {
  delay?: number
  attempts?: number
  priority?: number
}

export type JobHandler = (payload: JobPayload) => Promise<void>

export interface JobStatus {
  id: string
  name: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  attempts: number
  createdAt: Date
}

export async function createQueueAdapter(): Promise<QueueAdapter> {
  const adapterType = process.env.QUEUE_ADAPTER || 'graphile'

  switch (adapterType) {
    case 'redis': {
      const { RedisQueueAdapter } = await import('./redis.adapter')
      return new RedisQueueAdapter()
    }
    case 'graphile':
    default: {
      const { GraphileQueueAdapter } = await import('./graphile.adapter')
      return new GraphileQueueAdapter()
    }
  }
}
