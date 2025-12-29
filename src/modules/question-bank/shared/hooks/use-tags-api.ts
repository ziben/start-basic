import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qbApiClient, type CreateTagData, type UpdateTagData } from '../services/qb-api-client'
import { QB_QUERY_KEYS } from '../query-keys'

export function useTags() {
  return useQuery({
    queryKey: QB_QUERY_KEYS.tags.all,
    queryFn: () => qbApiClient.tags.list(),
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTagData) => qbApiClient.tags.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.tags.all })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagData }) => 
      qbApiClient.tags.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.tags.all })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qbApiClient.tags.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.tags.all })
    },
  })
}

