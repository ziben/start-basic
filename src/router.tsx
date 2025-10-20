import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { GeneralError } from './features/errors/general-error';
import { NotFoundError } from './features/errors/not-found-error';
import { routeTree } from './routeTree.gen';


export function getRouter() {
  // 创建 QueryClient，用于管理数据获取和缓存
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 300, // 5 minutes for dashboard data
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient, user: null },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30000, // 30 seconds
    defaultErrorComponent: GeneralError,
    defaultNotFoundComponent: NotFoundError,
    scrollRestoration: true,
    defaultStructuralSharing: true,
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