import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useNavitems(navGroupId?: string) {
  return useQuery({
    queryKey: ['admin', 'navitems', navGroupId],
    queryFn: async () => {
      const url = navGroupId
        ? `/api/admin/navitem?navGroupId=${encodeURIComponent(navGroupId)}`
        : '/api/admin/navitem'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`获取导航项失败: ${response.statusText}`)
      }
      return await response.json()
    }
    // 移除enabled条件，确保无论是否有navGroupId都加载数据
  })
}

export function useNavitem(id: string) {
  return useQuery({
    queryKey: ['admin', 'navitem', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/navitem/${encodeURIComponent(id)}`)
      if (!response.ok) {
        throw new Error(`获取导航项失败: ${response.statusText}`)
      }
      return await response.json()
    },
    enabled: !!id
  })
}

export interface CreateNavItemData {
  title: string
  url?: string
  icon?: string
  badge?: string
  isCollapsible?: boolean
  navGroupId: string
  parentId?: string
  orderIndex?: number
}

export function useCreateNavitem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateNavItemData) => {
      const response = await fetch('/api/admin/navitem/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`创建导航项失败: ${response.statusText}`)
      }
      
      return await response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems', variables.navGroupId] })
    },
  })
}

export interface UpdateNavItemData {
  id: string
  data: {
    title?: string
    url?: string
    icon?: string
    badge?: string
    isCollapsible?: boolean
    navGroupId?: string
    parentId?: string
    orderIndex?: number
  }
}

export function useUpdateNavitem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: UpdateNavItemData) => {
      const response = await fetch(`/api/admin/navitem/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`更新导航项失败: ${response.statusText}`)
      }
      
      return await response.json()
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
  
  return useMutation({
    mutationFn: async ({ id, navGroupId }: DeleteNavItemData) => {
      const response = await fetch(`/api/admin/navitem/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`删除导航项失败: ${response.statusText}`)
      }
      
      return await response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems', variables.navGroupId] })
    },
  })
}

export function useUpdateNavitemOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (itemIds: string[]) => {
      const response = await fetch('/api/admin/navitem/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds }),
      })
      
      if (!response.ok) {
        throw new Error(`更新导航项顺序失败: ${response.statusText}`)
      }
      
      return await response.json()
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

// 切换导航项可见性的hook
export function useToggleNavItemVisibility() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, isVisible }: ToggleNavItemVisibilityData) => {
      const response = await fetch('/api/admin/navitem/visibility', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isVisible }),
      })
      
      if (!response.ok) {
        throw new Error(`切换导航项可见性失败: ${response.statusText}`)
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navitems'] })
    },
  })
}
