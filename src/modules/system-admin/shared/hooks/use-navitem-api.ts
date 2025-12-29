import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { navitemApi } from '../services/navitem-api'
import type {
  AdminNavItem,
  AdminNavItemList,
  CreateNavItemData,
  UpdateNavItemData as SchemaUpdateNavItemData,
} from '@/modules/system-admin/features/navigation/navitem'
import { SIDEBAR_QUERY_KEY } from '~/modules/system-admin/shared/sidebar'

type SuccessIdResponse = { success: true; id: string }
type NavItemVisibilityResponse = { success: true; id: string; isVisible: boolean }

export function useNavitems(navGroupId?: string, scope?: 'APP' | 'ADMIN') {
  return useQuery<AdminNavItemList>({
    queryKey: ['admin', 'navitems', navGroupId, scope ?? 'ALL'],
    queryFn: () => navitemApi.list(navGroupId, scope),
  })
}

export function useNavitem(id: string) {
  return useQuery<AdminNavItem>({
    queryKey: ['admin', 'navitem', id],
    queryFn: () => navitemApi.get(id),
    enabled: !!id,
  })
}

export function useCreateNavitem() {
  const queryClient = useQueryClient()

  return useMutation<AdminNavItem, Error, CreateNavItemData>({
    mutationFn: (data: CreateNavItemData) => navitemApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems', variables.navGroupId] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
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
    mutationFn: ({ id, data }: UpdateNavItemData) => navitemApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitem', variables.id] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
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
    mutationFn: (variables: DeleteNavItemData) => navitemApi.remove(variables.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems', variables.navGroupId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems'] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}

export function useUpdateNavitemOrder() {
  const queryClient = useQueryClient()

  return useMutation<{ success: true }, Error, string[]>({
    mutationFn: (itemIds: string[]) => navitemApi.updateOrder(itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems'] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
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
      return await navitemApi.toggleVisibility({ id, isVisible })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems'] })
      queryClient.invalidateQueries({ queryKey: SIDEBAR_QUERY_KEY })
    },
  })
}







