import { useQuery } from '@tanstack/react-query'
import { getPermissionsFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'

export function usePermissionsQuery() {
  return useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: async () => {
      return await getPermissionsFn()
    },
    staleTime: 1000 * 60 * 5, // 5 分钟
  })
}
