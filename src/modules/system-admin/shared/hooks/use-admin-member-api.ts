import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { memberApi } from '../services/member-api'
import type { AdminMemberInfo } from '../types/member'

export type { AdminMemberInfo }

export type AdminMembersPage = {
  items: AdminMemberInfo[]
  total: number
  pageCount: number
}

export function useAdminMembers(params?: {
  page?: number
  pageSize?: number
  filter?: string
  organizationId?: string
  sortBy?: string
  sortDir?: string
}) {
  return useQuery({
    queryKey: ['admin-members', params],
    queryFn: () => memberApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useAdminMember(id: string) {
  return useQuery({
    queryKey: ['admin-member', id],
    queryFn: () => memberApi.get(id),
    enabled: !!id,
  })
}

export function useCreateAdminMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { organizationId: string; userId: string; role: string }) => memberApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
    },
  })
}

export function useUpdateAdminMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string } }) => memberApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      queryClient.invalidateQueries({ queryKey: ['admin-member', id] })
    },
  })
}

export function useDeleteAdminMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => memberApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
    },
  })
}

export function useBulkDeleteAdminMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { ids: string[] }) => memberApi.bulkDelete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
    },
  })
}





