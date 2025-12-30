import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { roleApi } from '../services/role-api'
import type { CreateRoleData, UpdateRoleData, SystemRole } from '@/modules/system-admin/features/identity/roles/data/schema'

export function useRoles(params: { page: number; pageSize: number; filter?: string }) {
  return useQuery({
    queryKey: ['admin', 'roles', params],
    queryFn: ({ signal }) => roleApi.list({ ...params, signal }),
  })
}

export function useRole(id?: string) {
  return useQuery({
    queryKey: ['admin', 'role', id],
    queryFn: () => {
      if (!id) return null
      return roleApi.get(id)
    },
    enabled: !!id,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRoleData) => roleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleData }) => roleApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'role', variables.id] })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => roleApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
    },
  })
}

export function useAssignRoleNavGroups() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, navGroupIds }: { id: string; navGroupIds: string[] }) =>
      roleApi.assignNavGroups(id, navGroupIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'role', variables.id] })
    },
  })
}
