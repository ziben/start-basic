/**
 * NavGroup API Hooks - React Query 封装
 *
 * 使用 ServerFn 替代 REST API 调用
 * 优点：端到端类型安全、无需 HTTP 请求
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNavGroupsFn,
  getNavGroupFn,
  createNavGroupFn,
  updateNavGroupFn,
  deleteNavGroupFn,
  updateNavGroupOrderFn,
  updateNavGroupVisibilityFn,
} from '../server-fns/navgroup.fn'
import type {
  AdminNavgroup,
  CreateNavgroupData,
  UpdateNavgroupData,
  UserRoleNavGroup,
} from '@/modules/system-admin/features/navigation/navgroup'
import { SIDEBAR_QUERY_KEY } from '~/modules/system-admin/shared/sidebar'

type SuccessIdResponse = { success: true; id: string }

export type UpdateNavgroupVisibilityData = {
  userId: string
  navGroupId: string
  visible: boolean
}

// ============ Query Keys ============

export const navgroupQueryKeys = {
  all: ['admin', 'navgroups'] as const,
  list: (scope?: 'APP' | 'ADMIN') => [...navgroupQueryKeys.all, scope ?? 'ALL'] as const,
  detail: (id: string) => ['admin', 'navgroup', id] as const,
}

// ============ Query Hooks ============

/**
 * 获取所有导航组
 */
export function useNavgroups(scope?: 'APP' | 'ADMIN') {
  return useQuery<AdminNavgroup[]>({
    queryKey: navgroupQueryKeys.list(scope),
    queryFn: async () => {
      const result = await getNavGroupsFn({ data: { scope } })
      return result as AdminNavgroup[]
    },
  })
}

/**
 * 获取单个导航组信息
 */
export function useNavgroup(id?: string) {
  return useQuery<AdminNavgroup | null>({
    queryKey: navgroupQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null
      const result = await getNavGroupFn({ data: { id } })
      return result as AdminNavgroup
    },
    enabled: !!id,
  })
}

// ============ Mutation Hooks ============

/**
 * 创建导航组
 */
export function useCreateNavgroup() {
  const queryClient = useQueryClient()

  return useMutation<AdminNavgroup, Error, CreateNavgroupData>({
    mutationFn: async (data: CreateNavgroupData) => {
      const result = await createNavGroupFn({ data })
      return result as AdminNavgroup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navgroupQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

/**
 * 更新导航组
 */
export function useUpdateNavgroup() {
  const queryClient = useQueryClient()

  return useMutation<AdminNavgroup, Error, { id: string; data: UpdateNavgroupData }>({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNavgroupData }) => {
      const result = await updateNavGroupFn({ data: { id, ...data } })
      return result as AdminNavgroup
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: navgroupQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: navgroupQueryKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

/**
 * 删除导航组
 */
export function useDeleteNavgroup() {
  const queryClient = useQueryClient()

  return useMutation<SuccessIdResponse, Error, string>({
    mutationFn: async (id: string) => {
      const result = await deleteNavGroupFn({ data: { id } })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navgroupQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

/**
 * 更新导航组顺序
 */
export function useUpdateNavgroupOrder() {
  const queryClient = useQueryClient()

  return useMutation<{ success: true }, Error, string[]>({
    mutationFn: async (groupIds: string[]) => {
      const result = await updateNavGroupOrderFn({ data: { groupIds } })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navgroupQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

/**
 * 更新导航组可见性
 */
export function useUpdateNavgroupVisibility() {
  const queryClient = useQueryClient()

  return useMutation<UserRoleNavGroup, Error, UpdateNavgroupVisibilityData>({
    mutationFn: async (data: UpdateNavgroupVisibilityData) => {
      const result = await updateNavGroupVisibilityFn({
        data: {
          userId: data.userId,
          navGroupId: data.navGroupId,
          visible: data.visible,
        },
      })
      return result as UserRoleNavGroup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navgroupQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

// Re-export a compact name expected elsewhere in the codebase
export type NavGroup = AdminNavgroup
