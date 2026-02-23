import { useQueries, useQuery } from '@tanstack/react-query'
import { useAuth } from '~/modules/auth/shared/hooks/use-auth'
import { orgPermissionQueryKeys } from '~/shared/lib/query-keys'
import { checkOrgPermissionFn, getOrgRoleFn } from '~/shared/server-fns/org-permissions.fn'
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
 */
export function useAnyOrgPermission(
  organizationId: string | undefined,
  permissions: Array<{ resource: string; action: string }>
) {
  const { data: session } = useAuth()
  const user = session?.user

  const queries = useQueries({
    queries: permissions.map(({ resource, action }) => ({
      queryKey: orgPermissionQueryKeys.check(user?.id, organizationId, resource, action),
      queryFn: () => {
        if (!organizationId) return false
        return checkOrgPermissionFn({
          data: { organizationId, resource, action }
        })
      },
      enabled: !!user && !!organizationId && !!resource && !!action,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const isLoading = queries.some(q => q.isLoading)
  const hasPermission = queries.some(q => q.data === true)

  return { hasPermission, isLoading }
}

/**
 * Hook: 检查多个组织权限（全部满足）
 */
export function useAllOrgPermissions(
  organizationId: string | undefined,
  permissions: Array<{ resource: string; action: string }>
) {
  const { data: session } = useAuth()
  const user = session?.user

  const queries = useQueries({
    queries: permissions.map(({ resource, action }) => ({
      queryKey: orgPermissionQueryKeys.check(user?.id, organizationId, resource, action),
      queryFn: () => {
        if (!organizationId) return false
        return checkOrgPermissionFn({
          data: { organizationId, resource, action }
        })
      },
      enabled: !!user && !!organizationId && !!resource && !!action,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const isLoading = queries.some(q => q.isLoading)
  const hasPermission = queries.every(q => q.data === true)

  return { hasPermission, isLoading }
}
