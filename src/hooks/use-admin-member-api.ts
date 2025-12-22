import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '~/lib/api-client'

export type AdminMemberInfo = {
  id: string
  userId: string
  username: string
  email: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  role: string
  createdAt: string
}

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
    queryFn: () => apiClient.adminMembers.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useAdminMember(id: string) {
  return useQuery({
    queryKey: ['admin-member', id],
    queryFn: () => apiClient.adminMembers.get(id),
    enabled: !!id,
  })
}

export function useCreateAdminMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { organizationId: string; userId: string; role: string }) => apiClient.adminMembers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
    },
  })
}

export function useUpdateAdminMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string } }) => apiClient.adminMembers.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      queryClient.invalidateQueries({ queryKey: ['admin-member', id] })
    },
  })
}

export function useDeleteAdminMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.adminMembers.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
    },
  })
}

export function useBulkDeleteAdminMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { ids: string[] }) => apiClient.adminMembers.bulkDelete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
    },
  })
}
