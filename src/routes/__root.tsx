import * as React from 'react'
import { type QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
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

const getUser = createServerFn({ method: 'GET' }).handler(async () => {
  const { auth } = await import('../modules/auth/shared/lib/auth')
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  return session?.user || null
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  user: Awaited<ReturnType<typeof getUser>>
}>()({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.fetchQuery({
      queryKey: userQueryKeys.current,
      queryFn: ({ signal }) => getUser({ signal }),
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
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#ffffff',
                      zIndex: 9999,
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
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
        <HeadContent />
      </head>
      <body className='group/body'>
        {children}
        <Scripts />
      </body>
    </html>
  )
}









