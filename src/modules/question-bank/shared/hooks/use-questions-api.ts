import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qbApiClient, type CreateQuestionData, type UpdateQuestionData } from '../services/qb-api-client'
import { QB_QUERY_KEYS } from '../query-keys'

export function useQuestions(params?: Parameters<typeof qbApiClient.questions.list>[0]) {
  return useQuery({
    queryKey: QB_QUERY_KEYS.questions.list(params),
    queryFn: () => qbApiClient.questions.list(params),
  })
}

export function useQuestion(id?: string) {
  return useQuery({
    queryKey: QB_QUERY_KEYS.questions.detail(id!),
    queryFn: () => qbApiClient.questions.get(id!),
    enabled: !!id,
  })
}

export function useCreateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateQuestionData) => qbApiClient.questions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.questions.all })
    },
  })
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionData }) => 
      qbApiClient.questions.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.questions.all })
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.questions.detail(id) })
    },
  })
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qbApiClient.questions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QB_QUERY_KEYS.questions.all })
    },
  })
}
