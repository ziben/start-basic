import { useQueryClient } from '@tanstack/react-query'

type OptimisticUpdateOptions<TItem, TVariables> = {
  queryKey: readonly unknown[]
  updateFn: (items: TItem[], variables: TVariables) => TItem[]
}

export function useOptimisticListUpdate<TItem>() {
  const queryClient = useQueryClient()

  const getOptimisticMutationOptions = <TVariables>(options: OptimisticUpdateOptions<TItem, TVariables>) => ({
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey as unknown[] })
      const previous = queryClient.getQueriesData({ queryKey: options.queryKey as unknown[] })

      queryClient.setQueriesData({ queryKey: options.queryKey as unknown[] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('items' in old)) return old
        const oldData = old as { items: TItem[]; total: number; pageSize: number; pageCount: number }
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
          queryClient.setQueryData(key as unknown[], data)
        }
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: options.queryKey as unknown[] })
    },
  })

  return { getOptimisticMutationOptions }
}
