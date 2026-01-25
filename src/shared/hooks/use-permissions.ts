/**
 * 权限控制 Hooks
 * 用于前端权限检查和控制
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { useAuth } from '~/modules/auth/shared/hooks/use-auth'
import { permissionsQueryKeys } from '../lib/query-keys'

/**
 * 获取当前用户的所有权限
 */
const getUserPermissionsFn = createServerFn({ method: 'GET' })
  .inputValidator((data?: { organizationId?: string }) => data)
  .handler(async ({ data }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/auth/shared/lib/auth')
    const { getUserPermissions } = await import('~/modules/admin/shared/lib/permission-check')
    
    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw new Error('未登录')
    
    return getUserPermissions(session.user.id, data?.organizationId)
  })

/**
 * 检查用户是否有指定权限
 */
const checkPermissionFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { permission: string; organizationId?: string }) => data)
  .handler(async ({ data }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/auth/shared/lib/auth')
    const { checkPermission } = await import('~/modules/admin/shared/lib/permission-check')
    
    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return false
    
    return checkPermission(session.user.id, data.permission, {
      organizationId: data.organizationId
    })
  })

/**
 * Hook: 获取用户权限列表
 */
export function usePermissions(organizationId?: string) {
  const { data: session } = useAuth()
  const user = session?.user
  
  return useQuery({
    queryKey: permissionsQueryKeys.list(user?.id, organizationId),
    queryFn: () => getUserPermissionsFn({ data: { organizationId } }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * Hook: 检查单个权限
 */
export function usePermission(permission: string, organizationId?: string) {
  const { data: session } = useAuth()
  const user = session?.user
  
  return useQuery({
    queryKey: permissionsQueryKeys.check(user?.id, permission, organizationId),
    queryFn: () => checkPermissionFn({ data: { permission, organizationId } }),
    enabled: !!user && !!permission,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook: 检查多个权限（任一满足）
 */
export function useAnyPermission(permissions: string[], organizationId?: string) {
  const { data: userPermissions, isLoading } = usePermissions(organizationId)
  
  const hasPermission = permissions.some(p => userPermissions?.includes(p))
  
  return { hasPermission, isLoading }
}

/**
 * Hook: 检查多个权限（全部满足）
 */
export function useAllPermissions(permissions: string[], organizationId?: string) {
  const { data: userPermissions, isLoading } = usePermissions(organizationId)
  
  const hasPermission = permissions.every(p => userPermissions?.includes(p))
  
  return { hasPermission, isLoading }
}

/**
 * Hook: 批量权限映射（单次请求）
 */
export function usePermissionsMap(permissions: string[], organizationId?: string) {
  const { data: userPermissions, isLoading } = usePermissions(organizationId)

  const permissionSet = useMemo(() => new Set(userPermissions || []), [userPermissions])
  const map = useMemo(
    () => Object.fromEntries(permissions.map(permission => [permission, permissionSet.has(permission)])),
    [permissions, permissionSet]
  )

  return { map, isLoading }
}

/**
 * Hook: 检查是否是管理员
 */
export function useIsAdmin() {
  const { data: session } = useAuth()
  const user = session?.user
  
  const isAdmin = ['admin', 'superadmin'].includes(user?.role || '')
  
  return { isAdmin, isSuperAdmin: user?.role === 'superadmin' }
}
