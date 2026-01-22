/**
 * Role API Hooks - React Query 封装
 * 
 * 已重构以对接新的 rbac.fn.ts 和系统角色逻辑
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getRolesFn,
  getRoleFn,
  createRoleFn,
  updateRoleFn,
  deleteRoleFn,
  assignPermissionsFn,
  assignRoleNavGroupsFn,
} from "@/modules/system-admin/shared/server-fns/rbac.fn"
import { permissionsQueryKeys, roleQueryKeys } from '~/shared/lib/query-keys'


// ============ Query Hooks ============

/**
 * 获取系统角色列表（支持分页和过滤）
 */
export function useRoles(params: { page?: number; pageSize?: number; filter?: string } = {}) {
  return useQuery({
    queryKey: roleQueryKeys.list(params),
    queryFn: async () => {
      return await getRolesFn({ data: params })
    },
    placeholderData: (previousData) => previousData,
  })
}

/**
 * 获取所有系统角色（不分页，通常用于下拉选择或关联管理）
 */
export function useAllRoles() {
  return useQuery({
    queryKey: roleQueryKeys.allList(),
    queryFn: async () => {
      // 传递一个较大的 pageSize 来模拟获取所有角色，或者根据后端实现调整
      const result = await getRolesFn({ data: { page: 1, pageSize: 1000 } })
      return result.items || []
    },
  })
}

/**
 * 获取单个系统角色详情
 */
export function useRole(id?: string) {
  return useQuery({
    queryKey: roleQueryKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null
      return await getRoleFn({ data: { id } })
    },
    enabled: !!id,
  })
}

// ============ Mutation Hooks ============

/**
 * 创建系统角色
 */
export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      return await createRoleFn({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
    },
  })
}

/**
 * 更新系统角色
 */
export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      return await updateRoleFn({ data: { id, ...data } })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(variables.id) })
    },
  })
}

/**
 * 删除系统角色
 */
export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteRoleFn({ data: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
    },
  })
}

/**
 * 分配系统角色导航组
 */
export function useAssignRoleNavGroups() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, navGroupIds }: { id: string; navGroupIds: string[] }) => {
      return await assignRoleNavGroupsFn({ data: { id, navGroupIds } })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(variables.id) })
    },
  })
}

/**
 * 分配系统角色权限
 */
export function useAssignRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      return await assignPermissionsFn({ data: { roleId, permissionIds } })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(variables.roleId) })
      // 同时也失效角色列表，因为权限数量等可能在列表中显示
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: permissionsQueryKeys.checkAll })
    },
  })
}
