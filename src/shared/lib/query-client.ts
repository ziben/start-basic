import { QueryClient } from '@tanstack/react-query'
import { adminUsersQueryKeys, authQueryKeys, navgroupQueryKeys, translationQueryKeys } from './query-keys'

export const CACHE_TIME = {
  SHORT: 1000 * 30, // 30 seconds - 用户数据等频繁变化的数据
  MEDIUM: 1000 * 60 * 5, // 5 minutes - 一般数据
  LONG: 1000 * 60 * 30, // 30 minutes - 静态配置数据
} as const

export function createQueryClient() {
  // 创建 QueryClient，用于管理数据获取和缓存
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: CACHE_TIME.MEDIUM,
        gcTime: CACHE_TIME.LONG, // 垃圾回收时间
        retry: 1, // 失败重试次数
      },
      mutations: {
        retry: 0, // mutation 不重试
      },
    },
  })

  // 为不同类型的数据设置不同的缓存策略
  queryClient.setQueryDefaults(navgroupQueryKeys.all, {
    staleTime: CACHE_TIME.LONG, // 菜单组数据变化较少
  })
  queryClient.setQueryDefaults(translationQueryKeys.all, {
    staleTime: CACHE_TIME.LONG, // 翻译数据变化较少
  })
  queryClient.setQueryDefaults(adminUsersQueryKeys.all, {
    staleTime: CACHE_TIME.SHORT, // 用户数据变化较频繁
  })
  queryClient.setQueryDefaults(authQueryKeys.session, {
    staleTime: CACHE_TIME.MEDIUM,
    gcTime: CACHE_TIME.LONG,
  })

  return queryClient
}
