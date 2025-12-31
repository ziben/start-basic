/**
 * Member API Hooks - React Query 封装
 *
 * 使用 ServerFn 替代 REST API 调用
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMembersFn,
  createMemberFn,
  updateMemberFn,
  deleteMemberFn,
  bulkDeleteMembersFn,
} from '../server-fns/member.fn'
import type { AdminMemberInfo } from '../types/member'

export type { AdminMemberInfo }

export type AdminMembersPage = {
  items: AdminMemberInfo[]
  total: number
  pageCount: number
}

// ============ Query Keys ============

export const memberQueryKeys = {
  all: ['admin-members'] as const,
  list: (params?: {
    page?: number
    pageSize?: number
    filter?: string
    organizationId?: string
    sortBy?: string
    sortDir?: string
  }) => [...memberQueryKeys.all, params] as const,
  detail: (id: string) => ['admin-member', id] as const,
}

// ============ Query Hooks ============

export function useAdminMembers(params?: {
  page?: number
  pageSize?: number
  filter?: string
  organizationId?: string
  sortBy?: string
  sortDir?: string
}) {
  return useQuery({
    queryKey: memberQueryKeys.list(params),
    queryFn: async () => {
      const result = await getMembersFn({
        data: params as { sortDir?: 'asc' | 'desc' } | undefined,
      })
      return result as AdminMembersPage
    },
    placeholderData: keepPreviousData,
  })
}

// ============ Mutation Hooks ============

export function useCreateAdminMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { organizationId: string; userId: string; role: string }) => {
      return await createMemberFn({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all })
    },
  })
}

export function useUpdateAdminMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { role?: string } }) => {
      return await updateMemberFn({ data: { id, ...data } })
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.detail(id) })
    },
  })
}

export function useDeleteAdminMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteMemberFn({ data: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all })
    },
  })
}

export function useBulkDeleteAdminMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { ids: string[] }) => {
      return await bulkDeleteMembersFn({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all })
    },
  })
}
