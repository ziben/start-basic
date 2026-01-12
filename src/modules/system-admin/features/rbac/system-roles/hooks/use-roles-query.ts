import { useQuery } from "@tanstack/react-query"
import { getRolesFn } from "@/modules/system-admin/shared/server-fns/rbac.fn"

interface UseRolesQueryProps {
  page?: number
  pageSize?: number
  filter?: string
}

export function useRolesQuery({ page, pageSize, filter }: UseRolesQueryProps = {}) {
  return useQuery({
    queryKey: ["rbac", "roles", { page, pageSize, filter }],
    queryFn: async () => {
      return await getRolesFn({
        data: {
          page,
          pageSize,
          filter,
        }
      })
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 分钟
  })
}