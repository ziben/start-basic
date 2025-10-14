import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminNavgroup, CreateNavgroupData, UpdateNavgroupData } from '~/features/admin/navgroup/data/schema'

// 获取所有导航组
export function useNavgroups() {
  return useQuery<AdminNavgroup[]>({ // Specify the return type for useQuery
    queryKey: ['admin', 'navgroups'],
    queryFn: async () => {
      const response = await fetch('/api/admin/navgroup/')
      if (!response.ok) {
        throw new Error(`获取导航组失败: ${response.statusText}`)
      }
      return await response.json() as AdminNavgroup[] // Assert the type of the JSON response
    },
  })
}

// 获取单个导航组信息
export function useNavgroup(id?: string) {
  return useQuery<AdminNavgroup | null>({ // Specify the return type
    queryKey: ['admin', 'navgroup', id],
    queryFn: async () => {
      if (!id) return null
      const response = await fetch(`/api/admin/navgroup/${encodeURIComponent(id)}`)
      if (!response.ok) {
        throw new Error(`获取导航组失败: ${response.statusText}`)
      }
      return await response.json() as AdminNavgroup // Assert the type
    },
    enabled: !!id
  })
}

// using CreateNavgroupData from schema

// 创建导航组
export function useCreateNavgroup() {
  const queryClient = useQueryClient()
  
  return useMutation<AdminNavgroup, Error, CreateNavgroupData>({ // Specify the return type
    mutationFn: async (data: CreateNavgroupData) => {
      const response = await fetch('/api/admin/navgroup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`创建导航组失败: ${response.statusText}`)
      }
      
      return await response.json() as AdminNavgroup // Assert the type
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
    },
  })
}

// using UpdateNavgroupData from schema

// 更新导航组
export function useUpdateNavgroup() {
  const queryClient = useQueryClient()
  
  return useMutation<AdminNavgroup, Error, { id: string; data: UpdateNavgroupData }>({ // Specify the return type
    mutationFn: async ({ id, data }: { id: string; data: UpdateNavgroupData }) => {
      const response = await fetch(`/api/admin/navgroup/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`更新导航组失败: ${response.statusText}`)
      }
      
      return await response.json() as AdminNavgroup // Assert the type
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroup', variables.id] })
    },
  })
}

// 删除导航组
export function useDeleteNavgroup() {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string>({ // Specify the return type
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/navgroup/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`删除导航组失败: ${response.statusText}`)
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
    },
  })
}

// 更新导航组顺序
export function useUpdateNavgroupOrder() {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string[]>({ // Specify the return type
    mutationFn: async (groupIds: string[]) => {
      const response = await fetch('/api/admin/navgroup/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupIds }),
      })
      
      if (!response.ok) {
        throw new Error(`更新导航组顺序失败: ${response.statusText}`)
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
    },
  })
}

export interface UpdateNavgroupVisibilityData {
  userId: string
  navGroupId: string
  isVisible: boolean
}

// 更新导航组可见性
export function useUpdateNavgroupVisibility() {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, UpdateNavgroupVisibilityData>({ // Specify the return type
    mutationFn: async (data: UpdateNavgroupVisibilityData) => {
      const response = await fetch('/api/admin/navgroup/visibility', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`更新导航组可见性失败: ${response.statusText}`)
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'navgroups'] })
    },
  })
}

// Re-export a compact name expected elsewhere in the codebase
export type NavGroup = AdminNavgroup
