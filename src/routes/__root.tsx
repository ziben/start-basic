import * as React from 'react'
import { type QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import Devtools from '~/components/devtools'
import { NavigationProgress } from '~/components/navigation-progress'
import { Toaster } from '~/components/ui/sonner'
import { AuthProvider } from '~/shared/context/auth-context'
import { DirectionProvider } from '~/shared/context/direction-provider'
import { LocaleProvider } from '~/shared/context/locale-context'
import { ThemeProvider } from '~/shared/context/theme-provider'
import { useRouteSeoSync } from '~/shared/hooks/use-route-seo-sync'
import { userQueryKeys } from '~/shared/lib/query-keys'
import appCss from '~/styles/index.css?url'
import appCssLegacy from '~/styles/index.legacy.css?url'
import { composeSeoDescription, composeSeoTitle, seo } from '@/shared/utils/seo'
import { GeneralError, NotFoundError } from '@/shared/components/errors'
import { DynamicCSSLoader, useCSSReady } from '@/shared/components/dynamic-css-loader'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentUserFn } from '~/shared/server-fns/auth.fn'

// SSR 和初始渲染都使用原始 CSS，避免 hydration 不匹配
// 客户端会根据浏览器能力动态替换为 legacy CSS（如果需要）
const cssUrl = appCss

if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', {
    value: function at<T>(this: ArrayLike<T>, index: number): T | undefined {
      let i = Math.trunc(index) || 0
      if (i < 0) i += this.length
      if (i < 0 || i >= this.length) return undefined
      return this[i]
    },
    writable: true,
    configurable: true,
  })
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  user: Awaited<ReturnType<typeof getCurrentUserFn>>
}>()({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.fetchQuery({
      queryKey: userQueryKeys.current,
      queryFn: ({ signal }) => getCurrentUserFn({ signal }),
    }) // we're using react-query for caching, see router.tsx
    return { user }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: composeSeoTitle({}),
        description: composeSeoDescription({}),
      }),
    ],
    links: [
      { rel: 'stylesheet', href: cssUrl },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
  component: RootComponent,
})

function RootComponent(): React.ReactElement {
  useRouteSeoSync()
  const { isReady, handleReady } = useCSSReady()

  return (
    <React.StrictMode>
      <DynamicCSSLoader modernUrl={appCss} legacyUrl={appCssLegacy} onReady={handleReady} />
      <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
        <DirectionProvider>
          <LocaleProvider>
            <AuthProvider>
              <RootDocument>
                {!isReady && (
                  <div className="fixed inset-0 z-[9999] bg-white">
                    <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 px-6 py-10">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-2/5" />
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ visibility: isReady ? 'visible' : 'hidden' }}>
                  <NavigationProgress />
                  <Outlet />
                  <Toaster duration={5000} />
                  <Devtools />
                </div>
              </RootDocument>
            </AuthProvider>
          </LocaleProvider>
        </DirectionProvider>
      </ThemeProvider>
    </React.StrictMode>
  )
}

function RootDocument({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `if(!Object.hasOwn){Object.hasOwn=function(o,p){return Object.prototype.hasOwnProperty.call(o,p)}}` }} />
        <HeadContent />
      </head>
      <body className='group/body'>
        {children}
        <Scripts />
      </body>
    </html>
  )
}









