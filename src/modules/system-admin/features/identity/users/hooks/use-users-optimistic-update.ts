import { useOptimisticListUpdate } from '@/shared/hooks/use-optimistic-list-update'
import { type AdminUsers } from '../data/schema'

export function useUsersOptimisticUpdate() {
  return useOptimisticListUpdate<AdminUsers>()
}

export function createBulkBanUpdateFn(users: AdminUsers[], ids: string[], banned: boolean) {
  return users.map((u) =>
    ids.includes(u.id)
      ? {
          ...u,
          banned,
          banReason: banned ? (u.banReason ?? null) : null,
          banExpires: banned ? (u.banExpires ?? null) : null,
        }
      : u
  )
}

export function createBulkDeleteUpdateFn(users: AdminUsers[], ids: string[]) {
  return users.filter((u) => !ids.includes(u.id))
}


