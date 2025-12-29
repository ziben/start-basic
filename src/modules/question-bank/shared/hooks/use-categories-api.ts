import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qbApiClient, type CreateCategoryData, type UpdateCategoryData } from '../services/qb-api-client'
import { QB_QUERY_KEYS } from '../query-keys'

export function useCategories(params?: { tree?: boolean }) {
  return useQuery({
    queryKey: QB_QUERY_KEYS.categories.list(params),
    queryFn: () => qbApiClient.categories.list(params),
  })
}

export function useCategory(id?: string) {
  return useQuery({
    queryKey: QB_QUERY_KEYS.categories.detail(id!),
    queryFn: () => qbApiClient.categories.get(id!),
    enabled: !!id,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCategoryData) => qbApiClient.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.categories.all })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) => 
      qbApiClient.categories.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.categories.all })
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.categories.detail(id) })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qbApiClient.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.categories.all })
    },
  })
}

