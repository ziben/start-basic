import { useQuery } from '@tanstack/react-query'
import { departmentQueryKeys } from '~/shared/lib/query-keys'
import { getDepartmentsFn } from '../server-fns/department.fn'
import { type Department } from '../data/schema'

type UseDepartmentsQueryProps = {
  organizationId: string
}

export function useDepartmentsQuery({ organizationId }: UseDepartmentsQueryProps) {
  const { data: departments = [], ...rest } = useQuery({
    queryKey: departmentQueryKeys.byOrg(organizationId),
    queryFn: async () => {
      const result = await getDepartmentsFn({ data: { organizationId } })
      return result as Department[]
    },
    enabled: !!organizationId,
  })

  return {
    departments,
    ...rest,
  }
}
