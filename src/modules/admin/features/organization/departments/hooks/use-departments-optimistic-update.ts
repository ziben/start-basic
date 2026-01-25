import { useOptimisticListUpdate } from '@/shared/hooks/use-optimistic-list-update'
import { type Department } from '../data/schema'

export function useDepartmentsOptimisticUpdate() {
  return useOptimisticListUpdate<Department>()
}

export function createBulkDeleteUpdateFn(departments: Department[], deletedIds: string[]) {
  return departments.filter((dept) => !deletedIds.includes(dept.id))
}
