import { create } from 'zustand'

interface User {
  id: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAuthenticated: () => !!get().user,
}))
