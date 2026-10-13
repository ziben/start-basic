import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { CACHE_TIME } from '~/shared/lib/query-client'
import { createHealthPersonFn, listHealthPersonsFn } from '../server-fns/health-person.fn'

export interface CreateHealthPersonData {
  readonly name: string
  readonly gender?: string
  readonly birthDate?: string
  readonly relationLabel?: string
  readonly note?: string
}

export const healthPersonKeys = {
  all: ['health', 'persons'] as const,
  list: () => [...healthPersonKeys.all, 'list'] as const,
}

export function useHealthPersonsQuery(): UseQueryResult<Awaited<ReturnType<typeof listHealthPersonsFn>>> {
  return useQuery({
    queryKey: healthPersonKeys.list(),
    queryFn: () => listHealthPersonsFn(),
    staleTime: CACHE_TIME.SHORT,
  })
}

export function useCreateHealthPerson(): UseMutationResult<
  Awaited<ReturnType<typeof createHealthPersonFn>>,
  Error,
  CreateHealthPersonData
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateHealthPersonData) => createHealthPersonFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: healthPersonKeys.all })
    },
  })
}
