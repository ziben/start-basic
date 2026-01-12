import { getPermissionsFn, getResourcesFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'
import { useQuery } from '@tanstack/react-query'

export const usePermissionsQuery = () => {
  return useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: () => getPermissionsFn(),
  })
}

export const useResourcesQuery = () => {
  return useQuery({
    queryKey: ['rbac', 'resources'],
    queryFn: () => getResourcesFn(),
  })
}
