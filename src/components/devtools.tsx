import { lazy, Suspense } from 'react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import ClientPlugin from './client-plugin'

const StudioPlugin = lazy(() => import('./prisma-plugin').then((m) => ({ default: m.StudioPlugin })))

export default function DevtoolsExample() {
  return (
    <TanStackDevtools
      eventBusConfig={{
        debug: false,
        connectToServerBus: true,
      }}
      plugins={[
        {
          name: 'TanStack Query',
          render: <ReactQueryDevtoolsPanel />,
        },
        {
          name: 'TanStack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
        {
          name: 'Prisma Studio',
          render: (
            <Suspense fallback={<div>Loading Prisma Studio...</div>}>
              <StudioPlugin />
            </Suspense>
          ),
        },
        {
          name: 'Client Plugin',
          render: <ClientPlugin />,
        },
      ]}
    />
  )
}
