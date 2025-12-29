import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { organizationApi } from '../services/organization-api'
import type { AdminOrganizationInfo } from '../types/organization'

export type { AdminOrganizationInfo }

export type AdminOrganizationsPage = {
  items: AdminOrganizationInfo[]
  total: number
  pageCount: number
}

export function useAdminOrganizations(params?: {
  page?: number
  pageSize?: number
  filter?: string
  sortBy?: string
  sortDir?: string
}) {
  return useQuery({
    queryKey: ['admin-organizations', params],
    queryFn: () => organizationApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useAdminOrganization(id: string) {
  return useQuery({
    queryKey: ['admin-organization', id],
    queryFn: () => organizationApi.get(id),
    enabled: !!id,
  })
}

export function useCreateAdminOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; slug?: string; logo?: string; metadata?: string }) =>
      organizationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
    },
  })
}

export function useUpdateAdminOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name?: string; slug?: string; logo?: string; metadata?: string }
    }) => organizationApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
      queryClient.invalidateQueries({ queryKey: ['admin-organization', id] })
    },
  })
}

export function useDeleteAdminOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => organizationApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
    },
  })
}

export function useBulkDeleteAdminOrganizations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { ids: string[] }) => organizationApi.bulkDelete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
    },
  })
}





