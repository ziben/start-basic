import { useQuery } from "@tanstack/react-query"
import { getOrganizationRolesFn, getRoleTemplatesFn } from "@/modules/system-admin/shared/server-fns/organization-role.fn"

interface UseOrgRolesQueryProps {
  organizationId: string
  page?: number
  pageSize?: number
  search?: string
}

export function useOrgRolesQuery({ organizationId, page, pageSize, search }: UseOrgRolesQueryProps) {
  return useQuery({
    queryKey: ["rbac", "org-roles", { organizationId, page, pageSize, search }],
    queryFn: async () => {
      if (!organizationId) return { data: [], pagination: { total: 0, totalPages: 0, page: 1, pageSize: 10 } }
      return await getOrganizationRolesFn({
        data: {
          organizationId,
          page,
          pageSize,
          search,
        }
      })
    },
    enabled: !!organizationId,
    placeholderData: (previousData) => previousData,
  })
}

export function useOrgRoleTemplatesQuery() {
  return useQuery({
    queryKey: ["rbac", "role-templates"],
    queryFn: async () => {
      return await getRoleTemplatesFn()
    },
  })
}