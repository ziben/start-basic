import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'

function getCacheTime() {
  return {
    SHORT: 1000 * 30, // 30 seconds - 用户数据等频繁变化的数据
    MEDIUM: 1000 * 60 * 5, // 5 minutes - 一般数据
    LONG: 1000 * 60 * 30, // 30 minutes - 静态配置数据
  } as const
}

export function getRouter() {
  const CACHE_TIME = getCacheTime()
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
  queryClient.setQueryDefaults(['admin', 'navgroups'], {
    staleTime: CACHE_TIME.LONG, // 导航组数据变化较少
  })
  queryClient.setQueryDefaults(['admin', 'translations'], {
    staleTime: CACHE_TIME.LONG, // 翻译数据变化较少
  })
  queryClient.setQueryDefaults(['admin-users'], {
    staleTime: CACHE_TIME.SHORT, // 用户数据变化较频繁
  })
  queryClient.setQueryDefaults(['auth-session'], {
    staleTime: CACHE_TIME.MEDIUM,
    gcTime: CACHE_TIME.LONG,
  })

  const router = createRouter({
    routeTree,
    context: { queryClient, user: null },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30000, // 30 seconds
    scrollRestoration: true,
    defaultStructuralSharing: true
  })
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

