import type { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '~/shared/context/auth-context'
import type { QuestionCommand, questionSearchSchema } from './domain'
import {
  getQuestionPaperFn,
  questionBankBootstrapFn,
  questionBankCommandFn,
  searchBankQuestionsFn,
} from './server-fns/question-bank.fn'

export const bankQueryKey = ['question-bank'] as const
export type Bootstrap = Awaited<ReturnType<typeof questionBankBootstrapFn>>
export type Bank = Bootstrap['banks'][number]
export type QuestionRow = Awaited<ReturnType<typeof searchBankQuestionsFn>>['rows'][number]
function useActorQueryKey() {
  const { user } = useAuth()
  return { userId: user?.id ?? null, role: user?.role ?? null }
}
export function useQuestionBankBootstrap() {
  const actor = useActorQueryKey()
  return useQuery({
    queryKey: [...bankQueryKey, actor, 'bootstrap'],
    queryFn: () => questionBankBootstrapFn(),
    enabled: !!actor.userId,
  })
}
export function useBankQuestions(input: z.infer<typeof questionSearchSchema>) {
  const actor = useActorQueryKey()
  return useQuery({
    queryKey: [...bankQueryKey, actor, 'questions', input],
    queryFn: () => searchBankQuestionsFn({ data: input }),
    enabled: !!actor.userId,
  })
}
export function useQuestionPaper(id: string) {
  const actor = useActorQueryKey()
  return useQuery({
    queryKey: [...bankQueryKey, actor, 'paper', id],
    queryFn: () => getQuestionPaperFn({ data: { id } }),
    enabled: !!actor.userId,
  })
}
export function useQuestionBankCommand() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (data: QuestionCommand) => questionBankCommandFn({ data }),
    onSuccess: async (result) => {
      await client.invalidateQueries({ queryKey: bankQueryKey })
      toast.success(result.message)
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
