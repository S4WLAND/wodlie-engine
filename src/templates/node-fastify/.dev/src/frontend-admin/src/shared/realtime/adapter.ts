/**
 * Adapter: Realtime (polling → websocket)
 *
 * NEXT_PUBLIC_REALTIME_ADAPTER=polling   → polling cada 30s (default)
 * NEXT_PUBLIC_REALTIME_ADAPTER=websocket → WebSocket nativo
 *
 * Migración: cambiar variable → sin cambios en componentes
 */

export interface RealtimeAdapter {
  subscribe(channel: string, callback: (data: unknown) => void): () => void
  unsubscribe(channel: string): void
}

export function createRealtimeAdapter(): RealtimeAdapter {
  const adapterType = process.env.NEXT_PUBLIC_REALTIME_ADAPTER || 'polling'

  switch (adapterType) {
    case 'websocket':
      return new WebSocketRealtimeAdapter()
    case 'polling':
    default:
      return new PollingRealtimeAdapter()
  }
}

class PollingRealtimeAdapter implements RealtimeAdapter {
  private intervals = new Map<string, ReturnType<typeof setInterval>>()
  private interval = Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL) || 30000

  subscribe(channel: string, callback: (data: unknown) => void): () => void {
    const timer = setInterval(async () => {
      callback({ channel, timestamp: Date.now() })
    }, this.interval)
    this.intervals.set(channel, timer)
    return () => this.unsubscribe(channel)
  }

  unsubscribe(channel: string): void {
    const timer = this.intervals.get(channel)
    if (timer) {
      clearInterval(timer)
      this.intervals.delete(channel)
    }
  }
}

class WebSocketRealtimeAdapter implements RealtimeAdapter {
  subscribe(_channel: string, _callback: (data: unknown) => void): () => void {
    throw new Error('WebSocketRealtimeAdapter: implementar cuando backend tenga WS')
  }
  unsubscribe(_channel: string): void {}
}
