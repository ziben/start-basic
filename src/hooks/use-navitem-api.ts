import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '~/lib/api-client'
import type { NavItemVisibilityResponse, SuccessIdResponse } from '~/lib/api-client'
import type {
  AdminNavItem,
  AdminNavItemList,
  CreateNavItemData,
  UpdateNavItemData as SchemaUpdateNavItemData,
} from '~/features/admin/navitem/data/schema'

export function useNavitems(navGroupId?: string) {
  return useQuery<AdminNavItemList>({
    queryKey: ['admin', 'navitems', navGroupId],
    queryFn: async () => {
      return await apiClient.navitems.list(navGroupId)
    },
  })
}

export function useNavitem(id: string) {
  return useQuery<AdminNavItem>({
    queryKey: ['admin', 'navitem', id],
    queryFn: async () => {
      return await apiClient.navitems.get(id)
    },
    enabled: !!id,
  })
}

export function useCreateNavitem() {
  const queryClient = useQueryClient()

  return useMutation<AdminNavItem, Error, CreateNavItemData>({
    mutationFn: async (data: CreateNavItemData) => {
      return await apiClient.navitems.create(data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems', variables.navGroupId] })
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
      return await apiClient.navitems.update(id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitem', variables.id] })
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
    mutationFn: async ({ id }: DeleteNavItemData) => {
      return await apiClient.navitems.remove(id)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems', variables.navGroupId] })
    },
  })
}

export function useUpdateNavitemOrder() {
  const queryClient = useQueryClient()

  return useMutation<{ success: true }, Error, string[]>({
    mutationFn: async (itemIds: string[]) => {
      return await apiClient.navitems.updateOrder(itemIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems'] })
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
      return await apiClient.navitems.toggleVisibility({ id, isVisible })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems'] })
    },
  })
}
