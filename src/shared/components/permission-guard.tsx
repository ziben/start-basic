/**
 * 权限守卫组件
 * 用于根据权限控制组件的显示
 */

import { useMemo, type ReactNode } from 'react'
import { useIsAdmin, usePermissionsMap } from '@/shared/hooks/use-permissions'

export type PermissionGuardLoadingFallback = ReactNode | ((state: { isLoading: boolean }) => ReactNode)

export interface PermissionGuardProps {
  children: ReactNode
  permission?: string
  anyPermissions?: string[]
  allPermissions?: string[]
  requireAdmin?: boolean
  organizationId?: string
  permissionsMap?: Record<string, boolean>
  fallback?: ReactNode
  loadingFallback?: PermissionGuardLoadingFallback
}

export type PermissionGuardPropTypes = PermissionGuardProps

/**
 * 权限守卫组件
 * 根据权限控制子组件的显示
 */
export function PermissionGuard({
  children,
  permission,
  anyPermissions,
  allPermissions,
  requireAdmin,
  organizationId,
  permissionsMap,
  fallback = null,
  loadingFallback,
}: PermissionGuardProps) {
  const { isAdmin } = useIsAdmin()
  const resolvedLoadingFallback = loadingFallback ?? fallback

  const permissionsForMap = useMemo(() => {
    const list: string[] = []
    if (permission) list.push(permission)
    if (anyPermissions?.length) list.push(...anyPermissions)
    if (allPermissions?.length) list.push(...allPermissions)
    return Array.from(new Set(list))
  }, [permission, anyPermissions, allPermissions])

  const permissionsMapQuery = usePermissionsMap(permissionsForMap, organizationId)
  const resolvedMap = permissionsMap ?? permissionsMapQuery.map
  const isLoading = permissionsMap ? false : permissionsMapQuery.isLoading

  const renderLoadingFallback = () => {
    if (typeof resolvedLoadingFallback === 'function') {
      return resolvedLoadingFallback({ isLoading })
    }
    return resolvedLoadingFallback
  }
  
  // 如果要求管理员权限
  if (requireAdmin) {
    return isAdmin ? <>{children}</> : <>{fallback}</>
  }
  
  // 单个权限检查
  if (permission) {
    if (isLoading) return <>{renderLoadingFallback()}</>
    return resolvedMap[permission] ? <>{children}</> : <>{fallback}</>
  }
  
  // 任一权限检查
  if (anyPermissions && anyPermissions.length > 0) {
    const hasPermission = anyPermissions.some(permissionKey => resolvedMap[permissionKey])

    if (isLoading) return <>{renderLoadingFallback()}</>
    return hasPermission ? <>{children}</> : <>{fallback}</>
  }
  
  // 全部权限检查
  if (allPermissions && allPermissions.length > 0) {
    const hasPermission = allPermissions.every(permissionKey => resolvedMap[permissionKey])

    if (isLoading) return <>{renderLoadingFallback()}</>
    return hasPermission ? <>{children}</> : <>{fallback}</>
  }
  
  // 没有指定任何权限要求，默认显示
  return <>{children}</>
}

/**
 * 管理员守卫组件
 */
export function AdminGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <PermissionGuard requireAdmin fallback={fallback}>{children}</PermissionGuard>
}

/**
 * 超级管理员守卫组件
 */
export function SuperAdminGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isSuperAdmin } = useIsAdmin()
  return isSuperAdmin ? <>{children}</> : <>{fallback}</>
}
