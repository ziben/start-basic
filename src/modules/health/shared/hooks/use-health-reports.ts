import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { CACHE_TIME } from '~/shared/lib/query-client'
import {
  compareHealthReportsFn,
  createHealthReportFn,
  getHealthReportFn,
  listHealthReportsFn,
  previewHealthReportFn,
} from '../server-fns/health-report.fn'

export interface HealthReportFilters {
  readonly page?: number
  readonly pageSize?: number
  readonly filter?: string
  readonly personId?: string
}

export interface CreateHealthReportData {
  readonly title: string
  readonly personId: string
  readonly examDate?: string
  readonly sourceFileName?: string
  readonly ocrText: string
}

export const healthReportKeys = {
  all: ['health', 'reports'] as const,
  lists: () => [...healthReportKeys.all, 'list'] as const,
  list: (filters: HealthReportFilters) => [...healthReportKeys.lists(), filters] as const,
  detail: (reportId: string) => [...healthReportKeys.all, 'detail', reportId] as const,
  compare: (leftReportId: string, rightReportId: string) =>
    [...healthReportKeys.all, 'compare', leftReportId, rightReportId] as const,
}

export function useHealthReportsQuery(
  filters: HealthReportFilters = {}
): UseQueryResult<Awaited<ReturnType<typeof listHealthReportsFn>>> {
  return useQuery({
    queryKey: healthReportKeys.list(filters),
    queryFn: () => listHealthReportsFn({ data: filters }),
    staleTime: CACHE_TIME.SHORT,
  })
}

export interface PreviewHealthReportData {
  readonly ocrText: string
  readonly sourceFileName?: string
}

export function usePreviewHealthReport(): UseMutationResult<
  Awaited<ReturnType<typeof previewHealthReportFn>>,
  Error,
  PreviewHealthReportData
> {
  return useMutation({
    mutationFn: (data: PreviewHealthReportData) => previewHealthReportFn({ data }),
  })
}

export function useHealthReportQuery(reportId: string): UseQueryResult<Awaited<ReturnType<typeof getHealthReportFn>>> {
  return useQuery({
    queryKey: healthReportKeys.detail(reportId),
    queryFn: () => getHealthReportFn({ data: { reportId } }),
    enabled: reportId.length > 0,
  })
}

export function useCompareHealthReportsQuery(leftReportId: string, rightReportId: string) {
  return useQuery({
    queryKey: healthReportKeys.compare(leftReportId, rightReportId),
    queryFn: () => compareHealthReportsFn({ data: { leftReportId, rightReportId } }),
    enabled: leftReportId.length > 0 && rightReportId.length > 0 && leftReportId !== rightReportId,
    staleTime: CACHE_TIME.SHORT,
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
