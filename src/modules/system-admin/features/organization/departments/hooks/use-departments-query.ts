import { useQuery } from '@tanstack/react-query'
import { getDepartmentsFn } from '../../../../shared/server-fns/department.fn'
import { type Department } from '../data/schema'

export const DEPARTMENTS_QUERY_KEY = ['admin', 'departments']

type UseDepartmentsQueryProps = {
  organizationId: string
}

export function useDepartmentsQuery({ organizationId }: UseDepartmentsQueryProps) {
  const { data: departments = [], ...rest } = useQuery({
    queryKey: [...DEPARTMENTS_QUERY_KEY, { organizationId }],
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
