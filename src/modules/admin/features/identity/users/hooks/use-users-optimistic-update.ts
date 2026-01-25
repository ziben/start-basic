import { useOptimisticListUpdate } from '@/shared/hooks/use-optimistic-list-update'
import { type AdminUser } from '../data/schema'

export function useUsersOptimisticUpdate() {
  return useOptimisticListUpdate<AdminUser>()
}

export function createBulkBanUpdateFn(users: AdminUser[], ids: string[], banned: boolean) {
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

export function createBulkDeleteUpdateFn(users: AdminUser[], ids: string[]) {
  return users.filter((u) => !ids.includes(u.id))
}




