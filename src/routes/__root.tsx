import * as React from 'react'
import { type QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import Devtools from '~/components/devtools'
import { NavigationProgress } from '~/components/navigation-progress'
import { Toaster } from '~/components/ui/sonner'
import { AppProviders } from '~/shared/context/app-providers'
import { useRouteSeoSync } from '~/shared/hooks/use-route-seo-sync'
import { userQueryKeys } from '~/shared/lib/query-keys'
import appCss from '~/styles/index.css?url'
import { composeSeoDescription, composeSeoTitle, seo } from '@/shared/utils/seo'
import { GeneralError, NotFoundError } from '@/shared/components/errors'
import { getCurrentUserFn } from '~/shared/server-fns/auth.fn'

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

  return (
    <React.StrictMode>
      <AppProviders>
        <RootDocument>
          <div>
            <NavigationProgress />
            <Outlet />
            <Toaster duration={5000} />
            <Devtools />
          </div>
        </RootDocument>
      </AppProviders>
    </React.StrictMode>
  )
}

function RootDocument({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `if(!Object.hasOwn){Object.hasOwn=function(o,p){return Object.prototype.hasOwnProperty.call(o,p)}}` }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = document.cookie.match(/vite-ui-theme=([^;]+)/)?.[1] || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
        <HeadContent />
      </head>
      <body className='group/body'>
        {children}
        <Scripts />
      </body>
    </html>
  )
}









