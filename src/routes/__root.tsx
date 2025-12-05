import { GeneralError } from '@/features/demo/errors/general-error'
import { NotFoundError } from '@/features/demo/errors/not-found-error'
import { type QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import * as React from 'react'
import { NavigationProgress } from '~/components/navigation-progress'
import { Toaster } from '~/components/ui/sonner'
import { AuthProvider } from '~/context/auth-context'
import { DirectionProvider } from '~/context/direction-provider'
import { FontProvider } from '~/context/font-provider'
import { LocaleProvider } from '~/context/locale-context'
import { ThemeProvider } from '~/context/theme-provider'
import { auth } from '~/lib/auth'
import appCss from '~/styles/index.css?url'
import { seo } from '~/utils/seo'

const getUser = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders()!;
  const session = await auth.api.getSession({ headers });

  return session?.user || null;
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient,
  user: Awaited<ReturnType<typeof getUser>>;
}>()({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.fetchQuery({
      queryKey: ["user"],
      queryFn: ({ signal }) => getUser({ signal }),
    }); // we're using react-query for caching, see router.tsx
    return { user };
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
        title: 'TanStack Start | Type-Safe, Client-First, Full-Stack React Framework',
        description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
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

function RootComponent() {
  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
        <DirectionProvider>
          <FontProvider>
            <LocaleProvider>
              <AuthProvider>
                <RootDocument>
                  <NavigationProgress />
                  <Outlet />
                  <Toaster duration={5000} />
                  {import.meta.env.MODE === 'development' && (
                    <>
                      <ReactQueryDevtools buttonPosition='bottom-left' />
                      <TanStackRouterDevtools position='bottom-right' />
                    </>
                  )}
                </RootDocument>
              </AuthProvider>
            </LocaleProvider>
          </FontProvider>
        </DirectionProvider>
      </ThemeProvider>
    </React.StrictMode>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
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
