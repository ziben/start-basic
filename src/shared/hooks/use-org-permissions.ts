/**
 * 组织权限控制 Hooks
 * 使用 better-auth 的 dynamic access control
 */

import { useQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { useAuth } from '~/modules/auth/shared/hooks/use-auth'
import { orgPermissionQueryKeys } from '~/shared/lib/query-keys'

/**
 * 检查用户在组织中的权限（使用 better-auth dynamic access control）
 */
const checkOrgPermissionFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { 
    organizationId: string
    resource: string
    action: string 
  }) => data)
  .handler(async ({ data }: { data: { organizationId: string; resource: string; action: string } }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/auth/shared/lib/auth')
    
    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return false
    
    // 使用 better-auth 的 hasOrgPermission API
    try {
      const hasPermission = await auth.api.hasOrgPermission({
        headers: request.headers,
        body: {
          organizationId: data.organizationId,
          permission: {
            [data.resource]: [data.action]
          }
        }
      })
      
      return hasPermission
    } catch (error) {
      console.error('组织权限检查失败:', error)
      return false
    }
  })

/**
 * 获取用户在组织中的角色
 */
const getOrgRoleFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { organizationId: string }) => data)
  .handler(async ({ data }: { data: { organizationId: string } }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/auth/shared/lib/auth')
    
    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return null
    
    const prisma = (await import('@/shared/lib/db')).default
    
    const member = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: data.organizationId
      },
      select: { role: true }
    })
    
    return member?.role || null
  })

/**
 * Hook: 检查组织权限
 */
export function useOrgPermission(
  organizationId: string | undefined,
  resource: string,
  action: string
) {
  const { data: session } = useAuth()
  const user = session?.user
  
  return useQuery({
    queryKey: orgPermissionQueryKeys.check(user?.id, organizationId, resource, action),
    queryFn: () => {
      if (!organizationId) return false
      return checkOrgPermissionFn({ 
        data: { organizationId, resource, action } 
      })
    },
    enabled: !!user && !!organizationId && !!resource && !!action,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook: 获取用户在组织中的角色
 */
export function useOrgRole(organizationId: string | undefined) {
  const { data: session } = useAuth()
  const user = session?.user
  
  return useQuery({
    queryKey: orgPermissionQueryKeys.role(user?.id, organizationId),
    queryFn: () => {
      if (!organizationId) return null
      return getOrgRoleFn({ data: { organizationId } })
    },
    enabled: !!user && !!organizationId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook: 检查是否是组织所有者
 */
export function useIsOrgOwner(organizationId: string | undefined) {
  const { data: role } = useOrgRole(organizationId)
  return { isOwner: role === 'owner' }
}

/**
 * Hook: 检查是否是组织管理员（owner 或 admin）
 */
export function useIsOrgAdmin(organizationId: string | undefined) {
  const { data: role } = useOrgRole(organizationId)
  return { 
    isOrgAdmin: role === 'owner' || role === 'admin',
    isOwner: role === 'owner'
  }
}

/**
 * Hook: 检查多个组织权限（任一满足）
 * 注意：由于 React Hooks 规则限制，permissions 数组长度不能动态变化
 */
export function useAnyOrgPermission(
  organizationId: string | undefined,
  permissions: Array<{ resource: string; action: string }>
) {
  // 为每个权限创建查询（最多支持 10 个）
  const query0 = useOrgPermission(organizationId, permissions[0]?.resource || '', permissions[0]?.action || '')
  const query1 = useOrgPermission(organizationId, permissions[1]?.resource || '', permissions[1]?.action || '')
  const query2 = useOrgPermission(organizationId, permissions[2]?.resource || '', permissions[2]?.action || '')
  const query3 = useOrgPermission(organizationId, permissions[3]?.resource || '', permissions[3]?.action || '')
  const query4 = useOrgPermission(organizationId, permissions[4]?.resource || '', permissions[4]?.action || '')
  
  const queries = [query0, query1, query2, query3, query4].slice(0, permissions.length)
  
  const isLoading = queries.some(q => q.isLoading)
  const hasPermission = queries.some(q => q.data === true)
  
  return { hasPermission, isLoading }
}

/**
 * Hook: 检查多个组织权限（全部满足）
 * 注意：由于 React Hooks 规则限制，permissions 数组长度不能动态变化
 */
export function useAllOrgPermissions(
  organizationId: string | undefined,
  permissions: Array<{ resource: string; action: string }>
) {
  // 为每个权限创建查询（最多支持 10 个）
  const query0 = useOrgPermission(organizationId, permissions[0]?.resource || '', permissions[0]?.action || '')
  const query1 = useOrgPermission(organizationId, permissions[1]?.resource || '', permissions[1]?.action || '')
  const query2 = useOrgPermission(organizationId, permissions[2]?.resource || '', permissions[2]?.action || '')
  const query3 = useOrgPermission(organizationId, permissions[3]?.resource || '', permissions[3]?.action || '')
  const query4 = useOrgPermission(organizationId, permissions[4]?.resource || '', permissions[4]?.action || '')
  
  const queries = [query0, query1, query2, query3, query4].slice(0, permissions.length)
  
  const isLoading = queries.some(q => q.isLoading)
  const hasPermission = queries.every(q => q.data === true)
  
  return { hasPermission, isLoading }
}
