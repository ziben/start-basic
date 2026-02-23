/**
 * 权限守卫组件
 * 用于根据权限控制组件的显示
 */

import { useMemo, type ReactNode } from 'react'
import { useIsAdmin, usePermissionsMap } from '@/shared/hooks/use-permissions'

export type PermissionGuardLoadingFallback = ReactNode | ((state: { isLoading: boolean }) => ReactNode)

// Base properties available across all modes
interface PermissionGuardBaseProps {
  children: ReactNode
  organizationId?: string
  permissionsMap?: Record<string, boolean>
  fallback?: ReactNode
  loadingFallback?: PermissionGuardLoadingFallback
}

// Discriminated Union to enforce mutually exclusive permission conditions
export type PermissionGuardProps = PermissionGuardBaseProps & (
  | { requireAdmin: true; permission?: never; anyPermissions?: never; allPermissions?: never }
  | { requireAdmin?: never; permission: string; anyPermissions?: never; allPermissions?: never }
  | { requireAdmin?: never; permission?: never; anyPermissions: string[]; allPermissions?: never }
  | { requireAdmin?: never; permission?: never; anyPermissions?: never; allPermissions: string[] }
  | { requireAdmin?: false; permission?: never; anyPermissions?: never; allPermissions?: never } // allow empty/no-op guard
)

/**
 * 权限守卫组件
 * 根据权限控制子组件的显示
 */
export function PermissionGuard(props: PermissionGuardProps) {
  const {
    children,
    fallback = null,
    loadingFallback,
    organizationId,
    permissionsMap,
  } = props

  const { isAdmin } = useIsAdmin()
  const resolvedLoadingFallback = loadingFallback ?? fallback

  const permissionsForMap = useMemo(() => {
    const list: string[] = []
    if (props.permission) list.push(props.permission)
    if (props.anyPermissions?.length) list.push(...props.anyPermissions)
    if (props.allPermissions?.length) list.push(...props.allPermissions)
    return Array.from(new Set(list))
  }, [props.permission, props.anyPermissions, props.allPermissions])

  const permissionsMapQuery = usePermissionsMap(permissionsForMap, organizationId)
  const resolvedMap = permissionsMap ?? permissionsMapQuery.map
  const isLoading = permissionsMap ? false : permissionsMapQuery.isLoading

  const renderLoadingFallback = () => {
    if (typeof resolvedLoadingFallback === 'function') {
      return resolvedLoadingFallback({ isLoading })
    }
    return resolvedLoadingFallback
  }

  // 1. Check if loading is pending
  if (isLoading && ('permission' in props || 'anyPermissions' in props || 'allPermissions' in props)) {
    return <>{renderLoadingFallback()}</>
  }

  // 2. Resolve access based on the specifically provided prop mode
  let hasAccess = false

  if (props.requireAdmin) {
    hasAccess = isAdmin
  } else if (isAdmin) {
    hasAccess = true
  } else if (props.permission) {
    hasAccess = !!resolvedMap[props.permission]
  } else if (props.anyPermissions && props.anyPermissions.length > 0) {
    hasAccess = props.anyPermissions.some(permissionKey => resolvedMap[permissionKey])
  } else if (props.allPermissions && props.allPermissions.length > 0) {
    hasAccess = props.allPermissions.every(permissionKey => resolvedMap[permissionKey])
  } else {
    // 默认通过 (如果什么条件都没传)
    hasAccess = true
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
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
