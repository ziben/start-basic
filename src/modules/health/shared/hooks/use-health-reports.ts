import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import {
  createHealthReportFn,
  getHealthReportFn,
  listHealthReportsFn,
} from '../server-fns/health-report.fn'

export interface HealthReportFilters {
  readonly page?: number
  readonly pageSize?: number
  readonly filter?: string
}

export interface CreateHealthReportData {
  readonly title: string
  readonly examDate?: string
  readonly sourceFileName?: string
  readonly ocrText: string
}

export const healthReportKeys = {
  all: ['health', 'reports'] as const,
  lists: () => [...healthReportKeys.all, 'list'] as const,
  list: (filters: HealthReportFilters) => [...healthReportKeys.lists(), filters] as const,
  detail: (reportId: string) => [...healthReportKeys.all, 'detail', reportId] as const,
}

export function useHealthReportsQuery(
  filters: HealthReportFilters = {},
): UseQueryResult<Awaited<ReturnType<typeof listHealthReportsFn>>> {
  return useQuery({
    queryKey: healthReportKeys.list(filters),
    queryFn: () => listHealthReportsFn({ data: filters }),
    staleTime: 30 * 1000,
  })
}

export function useHealthReportQuery(
  reportId: string,
): UseQueryResult<Awaited<ReturnType<typeof getHealthReportFn>>> {
  return useQuery({
    queryKey: healthReportKeys.detail(reportId),
    queryFn: () => getHealthReportFn({ data: { reportId } }),
    enabled: reportId.length > 0,
  })
}

export function useCreateHealthReport(): UseMutationResult<
  Awaited<ReturnType<typeof createHealthReportFn>>,
  Error,
  CreateHealthReportData
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateHealthReportData) => createHealthReportFn({ data }),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: healthReportKeys.lists() })
      queryClient.setQueryData(healthReportKeys.detail(report.id), report)
    },
  })
}
