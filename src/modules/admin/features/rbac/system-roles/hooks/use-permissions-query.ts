import { useQuery } from '@tanstack/react-query'
import { getPermissionsFn } from '../../server-fns/rbac.fn'
import { rbacPermissionsQueryKeys } from '~/shared/lib/query-keys'

export function usePermissionsQuery() {
  return useQuery({
    queryKey: rbacPermissionsQueryKeys.all,
    queryFn: async () => {
      return await getPermissionsFn()
    },
    staleTime: 1000 * 60 * 5, // 5 分钟
  })
}
