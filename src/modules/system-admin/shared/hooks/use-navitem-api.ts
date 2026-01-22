/**
 * NavItem API Hooks - React Query 封装
 *
 * 使用 ServerFn 替代 REST API 调用
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNavItemsFn,
  getNavItemFn,
  createNavItemFn,
  updateNavItemFn,
  deleteNavItemFn,
  updateNavItemOrderFn,
  toggleNavItemVisibilityFn,
} from '../server-fns/navitem.fn'
import type {
  AdminNavItem,
  AdminNavItemList,
  CreateNavItemData,
  UpdateNavItemData as SchemaUpdateNavItemData,
} from '@/modules/system-admin/features/navigation/navitem'
import { navitemQueryKeys, sidebarQueryKeys } from '~/shared/lib/query-keys'

type SuccessIdResponse = { success: true; id: string }
type NavItemVisibilityResponse = { success: true; id: string; isVisible: boolean }

// ============ Query Keys ============

// ============ Query Hooks ============

export function useNavitems(navGroupId?: string, scope?: 'APP' | 'ADMIN') {
  return useQuery<AdminNavItemList>({
    queryKey: navitemQueryKeys.list(navGroupId, scope),
    queryFn: async () => {
      const result = await getNavItemsFn({ data: { navGroupId, scope } })
      return result as AdminNavItemList
    },
  })
}

export function useNavitem(id: string) {
  return useQuery<AdminNavItem>({
    queryKey: navitemQueryKeys.detail(id),
    queryFn: async () => {
      const result = await getNavItemFn({ data: { id } })
      return result as AdminNavItem
    },
    enabled: !!id,
  })
}

// ============ Mutation Hooks ============

export function useCreateNavitem() {
  const queryClient = useQueryClient()

  return useMutation<AdminNavItem, Error, CreateNavItemData>({
    mutationFn: async (data: CreateNavItemData) => {
      const result = await createNavItemFn({ data })
      return result as AdminNavItem
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: navitemQueryKeys.list(variables.navGroupId) })
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.all })
    },
  })
}

export interface UpdateNavItemData {
  id: string
  data: SchemaUpdateNavItemData
}

export function useUpdateNavitem() {
  const queryClient = useQueryClient()

  return useMutation<AdminNavItem, Error, UpdateNavItemData>({
    mutationFn: async ({ id, data }: UpdateNavItemData) => {
      const result = await updateNavItemFn({ data: { id, ...data } })
      return result as AdminNavItem
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: navitemQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: navitemQueryKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.all })
    },
  })
}

export interface DeleteNavItemData {
  id: string
  navGroupId: string
}

export function useDeleteNavitem() {
  const queryClient = useQueryClient()

  return useMutation<SuccessIdResponse, Error, DeleteNavItemData>({
    mutationFn: async (variables: DeleteNavItemData) => {
      const result = await deleteNavItemFn({ data: { id: variables.id } })
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: navitemQueryKeys.list(variables.navGroupId) })
      queryClient.invalidateQueries({ queryKey: navitemQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.all })
    },
  })
}

export function useUpdateNavitemOrder() {
  const queryClient = useQueryClient()

  return useMutation<{ success: true }, Error, string[]>({
    mutationFn: async (itemIds: string[]) => {
      const result = await updateNavItemOrderFn({ data: { itemIds } })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navitemQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.all })
    },
  })
}

export interface ToggleNavItemVisibilityData {
  id: string
  isVisible: boolean
}

export function useToggleNavItemVisibility() {
  const queryClient = useQueryClient()

  return useMutation<NavItemVisibilityResponse, Error, ToggleNavItemVisibilityData>({
    mutationFn: async ({ id, isVisible }: ToggleNavItemVisibilityData) => {
      const result = await toggleNavItemVisibilityFn({ data: { id, isVisible } })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navitemQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.all })
    },
  })
}
