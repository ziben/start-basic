import { useOptimisticListUpdate } from '@/shared/hooks/use-optimistic-list-update'
import { type Organization } from '../data/schema'

export function useOrganizationsOptimisticUpdate() {
  return useOptimisticListUpdate<Organization>()
}

export function createBulkDeleteUpdateFn(organizations: Organization[], ids: string[]) {
  return organizations.filter((org) => !ids.includes(org.id))
}
