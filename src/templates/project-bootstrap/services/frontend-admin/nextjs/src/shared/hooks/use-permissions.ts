/**
 * Hook compartido: use-permissions
 *
 * Evalúa si el usuario tiene el nivel de permiso requerido según jerarquía de roles.
 * Los roles válidos son admin > editor > viewer.
 */

import { useAuth } from '@/shared/hooks/use-auth'

type Permission = 'admin' | 'editor' | 'viewer'

const ROLE_HIERARCHY: Record<Permission, number> = { admin: 3, editor: 2, viewer: 1 }

export function usePermissions() {
  const { user } = useAuth()

  function hasPermission(permission: Permission): boolean {
    if (!user) return false
    return (ROLE_HIERARCHY[user.role as Permission] ?? 0) >= ROLE_HIERARCHY[permission]
  }

  return { hasPermission, role: user?.role }
}
