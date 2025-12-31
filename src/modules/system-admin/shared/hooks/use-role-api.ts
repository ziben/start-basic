/**
 * Role API Hooks - React Query 封装
 *
 * 使用 ServerFn 替代 REST API 调用
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getRolesFn,
  getAllRolesFn,
  getRoleFn,
  createRoleFn,
  updateRoleFn,
  deleteRoleFn,
  assignRoleNavGroupsFn,
} from '../server-fns/role.fn'
import type {
  CreateRoleData,
  UpdateRoleData,
  SystemRole,
} from '@/modules/system-admin/features/identity/roles/data/schema'

// ============ Query Keys ============

export const roleQueryKeys = {
  all: ['admin', 'roles'] as const,
  list: (params: { page: number; pageSize: number; filter?: string }) =>
    [...roleQueryKeys.all, params] as const,
  detail: (id: string) => ['admin', 'role', id] as const,
}

// ============ Query Hooks ============

export function useRoles(params: { page: number; pageSize: number; filter?: string }) {
  return useQuery({
    queryKey: roleQueryKeys.list(params),
    queryFn: async () => {
      const result = await getRolesFn({ data: params })
      return result
    },
  })
}

export function useAllRoles() {
  return useQuery({
    queryKey: [...roleQueryKeys.all, 'all'],
    queryFn: async () => {
      const result = await getAllRolesFn()
      return result
    },
  })
}

export function useRole(id?: string) {
  return useQuery({
    queryKey: roleQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null
      const result = await getRoleFn({ data: { id } })
      return result
    },
    enabled: !!id,
  })
}

// ============ Mutation Hooks ============

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRoleData) => {
      const result = await createRoleFn({ data })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRoleData }) => {
      const result = await updateRoleFn({ data: { id, ...data } })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(variables.id) })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteRoleFn({ data: { id } })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
    },
  })
}

export function useAssignRoleNavGroups() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, navGroupIds }: { id: string; navGroupIds: string[] }) =>
      assignRoleNavGroupsFn({ data: { id, navGroupIds } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(variables.id) })
    },
  })
}
