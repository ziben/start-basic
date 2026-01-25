import { useQuery } from '@tanstack/react-query'
import { getPermissionsFn, getResourcesFn } from '@/modules/admin/shared/server-fns/rbac.fn'
import { rbacPermissionsQueryKeys, rbacResourcesQueryKeys } from '~/shared/lib/query-keys'

export const usePermissionsQuery = () => {
  return useQuery({
    queryKey: rbacPermissionsQueryKeys.all,
    queryFn: () => getPermissionsFn(),
  })
}

export const useResourcesQuery = () => {
  return useQuery({
    queryKey: rbacResourcesQueryKeys.all,
    queryFn: () => getResourcesFn(),
  })
}
