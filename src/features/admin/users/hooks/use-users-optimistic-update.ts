import { useQueryClient } from '@tanstack/react-query'
import { type AdminUsers } from '../data/schema'

type OptimisticUpdateOptions<TVariables> = {
  queryKey: readonly unknown[]
  updateFn: (old: AdminUsers[], variables: TVariables) => AdminUsers[]
}

export function useUsersOptimisticUpdate<TVariables>() {
  const queryClient = useQueryClient()

  const getOptimisticMutationOptions = (options: OptimisticUpdateOptions<TVariables>) => ({
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey })
      const previous = queryClient.getQueriesData({ queryKey: options.queryKey })

      queryClient.setQueriesData({ queryKey: options.queryKey }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('items' in old)) return old
        const oldData = old as { items: AdminUsers[]; total: number; pageSize: number; pageCount: number }
        return {
          ...oldData,
          items: options.updateFn(oldData.items, variables),
        }
      })

      return { previous }
    },
    onError: (_err: unknown, _variables: TVariables, ctx: { previous?: Array<[unknown, unknown]> } | undefined) => {
      if (ctx?.previous) {
        for (const [key, data] of ctx.previous) {
          queryClient.setQueryData(key, data)
        }
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: options.queryKey })
    },
  })

  return { getOptimisticMutationOptions }
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
