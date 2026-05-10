/**
 * Hook compartido: use-realtime
 *
 * Suscribe un canal de WebSocket y ejecuta el callback cuando llegan datos.
 * Desuscribe automáticamente al desmontar el componente.
 */

import { useEffect, useRef } from 'react'
import { createRealtimeAdapter } from '@/shared/realtime/adapter'

export function useRealtime(channel: string, callback: (data: unknown) => void) {
  const adapterRef = useRef(createRealtimeAdapter())

  useEffect(() => {
    const unsubscribe = adapterRef.current.subscribe(channel, callback)
    return () => unsubscribe()
  }, [channel, callback])
}
