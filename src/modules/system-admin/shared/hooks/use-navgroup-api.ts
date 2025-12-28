import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AdminNavgroup,
  CreateNavgroupData,
  UpdateNavgroupData,
  UserRoleNavGroup,
} from '~/modules/system-admin/features/navigation/navgroup/data/schema'
import { apiClient, type SuccessIdResponse, type UpdateNavgroupVisibilityData } from '@/shared/lib/api-client'
import { SIDEBAR_QUERY_KEY } from '~/modules/system-admin/shared/sidebar'

// 获取所有导航组
export function useNavgroups(scope?: 'APP' | 'ADMIN') {
  return useQuery<AdminNavgroup[]>({
    queryKey: ['admin', 'navgroups', scope ?? 'ALL'],
    queryFn: async () => {
      return await apiClient.navgroups.list(scope)
    },
  })
}

// 获取单个导航组信息
export function useNavgroup(id?: string) {
  return useQuery<AdminNavgroup | null>({
    queryKey: ['admin', 'navgroup', id],
    queryFn: async () => {
      if (!id) return null
      return await apiClient.navgroups.get(id)
    },
    enabled: !!id,
  })
}

// 创建导航组
export function useCreateNavgroup() {
  const queryClient = useQueryClient()

  return useMutation<AdminNavgroup, Error, CreateNavgroupData>({
    mutationFn: async (data: CreateNavgroupData) => {
      return await apiClient.navgroups.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

// 更新导航组
export function useUpdateNavgroup() {
  const queryClient = useQueryClient()

  return useMutation<AdminNavgroup, Error, { id: string; data: UpdateNavgroupData }>({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNavgroupData }) => {
      return await apiClient.navgroups.update(id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroup', variables.id] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

// 删除导航组
export function useDeleteNavgroup() {
  const queryClient = useQueryClient()

  return useMutation<SuccessIdResponse, Error, string>({
    mutationFn: async (id: string) => {
      return await apiClient.navgroups.remove(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

// 更新导航组顺序
export function useUpdateNavgroupOrder() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string[]>({
    mutationFn: async (groupIds: string[]) => {
      await apiClient.navgroups.updateOrder(groupIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

// 更新导航组可见性
export function useUpdateNavgroupVisibility() {
  const queryClient = useQueryClient()

  return useMutation<UserRoleNavGroup, Error, UpdateNavgroupVisibilityData>({
    mutationFn: async (data: UpdateNavgroupVisibilityData) => {
      return await apiClient.navgroups.updateVisibility(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

// Re-export a compact name expected elsewhere in the codebase
export type NavGroup = AdminNavgroup




