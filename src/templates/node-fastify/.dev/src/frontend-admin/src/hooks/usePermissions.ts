import { useAuth } from './useAuth'

type Permission = 'admin' | 'editor' | 'viewer'

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    const hierarchy: Record<Permission, number> = { admin: 3, editor: 2, viewer: 1 }
    return (hierarchy[user.role as Permission] ?? 0) >= hierarchy[permission]
  }

  return { hasPermission, role: user?.role }
}
