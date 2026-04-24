import { useAuthStore } from '@/shared/store/auth'

export function useAuth() {
  const { user, setUser, isAuthenticated } = useAuthStore()
  return { user, setUser, isAuthenticated: isAuthenticated() }
}
