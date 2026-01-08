/**
 * 权限守卫组件
 * 用于根据权限控制组件的显示
 */

import type { ReactNode } from 'react'
import { usePermission, useAnyPermission, useAllPermissions, useIsAdmin } from '../hooks/use-permissions'

interface PermissionGuardProps {
  children: ReactNode
  permission?: string
  anyPermissions?: string[]
  allPermissions?: string[]
  requireAdmin?: boolean
  organizationId?: string
  fallback?: ReactNode
}

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
  fallback = null,
}: PermissionGuardProps) {
  const { isAdmin } = useIsAdmin()
  
  // 始终调用所有 hooks（遵循 React Hooks 规则）
  const singlePermissionQuery = usePermission(permission || '', organizationId)
  const anyPermissionsQuery = useAnyPermission(anyPermissions || [], organizationId)
  const allPermissionsQuery = useAllPermissions(allPermissions || [], organizationId)
  
  // 如果要求管理员权限
  if (requireAdmin) {
    return isAdmin ? <>{children}</> : <>{fallback}</>
  }
  
  // 单个权限检查
  if (permission) {
    const { data: hasPermission, isLoading } = singlePermissionQuery
    
    if (isLoading) return <>{fallback}</>
    return hasPermission ? <>{children}</> : <>{fallback}</>
  }
  
  // 任一权限检查
  if (anyPermissions && anyPermissions.length > 0) {
    const { hasPermission, isLoading } = anyPermissionsQuery
    
    if (isLoading) return <>{fallback}</>
    return hasPermission ? <>{children}</> : <>{fallback}</>
  }
  
  // 全部权限检查
  if (allPermissions && allPermissions.length > 0) {
    const { hasPermission, isLoading } = allPermissionsQuery
    
    if (isLoading) return <>{fallback}</>
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
