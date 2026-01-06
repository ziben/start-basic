import { useOptimisticListUpdate } from '@/shared/hooks/use-optimistic-list-update'
import { type Member } from '../data/schema'

export function useMembersOptimisticUpdate() {
  return useOptimisticListUpdate<Member>()
}

export function createBulkDeleteUpdateFn(members: Member[], deletedIds: string[]) {
  return members.filter((member) => !deletedIds.includes(member.id))
}
