/**
 * Hook compartido: use-auth
 *
 * Expone el estado de sesión del usuario desde el store global.
 * Wrapper liviano sobre useAuthStore para simplificar el consumo en componentes.
 */

import { useAuthStore } from '@/shared/store/auth'

export function useAuth() {
  const { user, setUser, isAuthenticated } = useAuthStore()
  return { user, setUser, isAuthenticated: isAuthenticated() }
}
