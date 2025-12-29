import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { navgroupApi, type UpdateNavgroupVisibilityData } from '../services/navgroup-api'
import type {
  AdminNavgroup,
  CreateNavgroupData,
  UpdateNavgroupData,
  UserRoleNavGroup,
} from '@/modules/system-admin/features/navigation/navgroup'
import { SIDEBAR_QUERY_KEY } from '~/modules/system-admin/shared/sidebar'

type SuccessIdResponse = { success: true; id: string }

// 获取所有导航组
export function useNavgroups(scope?: 'APP' | 'ADMIN') {
  return useQuery<AdminNavgroup[]>({
    queryKey: ['admin', 'navgroups', scope ?? 'ALL'],
    queryFn: () => navgroupApi.list(scope),
  })
}

// 获取单个导航组信息
export function useNavgroup(id?: string) {
  return useQuery<AdminNavgroup | null>({
    queryKey: ['admin', 'navgroup', id],
    queryFn: () => {
      if (!id) return null
      return navgroupApi.get(id)
    },
    enabled: !!id,
  })
}

// 创建导航组
export function useCreateNavgroup() {
  const queryClient = useQueryClient()

  return useMutation<AdminNavgroup, Error, CreateNavgroupData>({
    mutationFn: (data: CreateNavgroupData) => navgroupApi.create(data),
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
    mutationFn: ({ id, data }: { id: string; data: UpdateNavgroupData }) => navgroupApi.update(id, data),
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
    mutationFn: (id: string) => navgroupApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

// 更新导航组顺序
export function useUpdateNavgroupOrder() {
  const queryClient = useQueryClient()

  return useMutation<{ success: true }, Error, string[]>({
    mutationFn: (groupIds: string[]) => navgroupApi.updateOrder(groupIds),
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
      return await navgroupApi.updateVisibility(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

// Re-export a compact name expected elsewhere in the codebase
export type NavGroup = AdminNavgroup







