import { QueryClient } from '@tanstack/react-query'

export const CACHE_TIME = {
  SHORT: 1000 * 30, // 30 seconds - 用户数据等频繁变化的数据
  MEDIUM: 1000 * 60 * 5, // 5 minutes - 一般数据
  LONG: 1000 * 60 * 30, // 30 minutes - 静态配置数据
} as const

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
  )
    return false
  return failureCount < 1
}

export function createQueryClient() {
  // 创建 QueryClient，用于管理数据获取和缓存
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: CACHE_TIME.MEDIUM,
        gcTime: CACHE_TIME.LONG, // 垃圾回收时间
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: 0, // mutation 不重试
      },
    },
  })

  return queryClient
}
