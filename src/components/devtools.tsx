import type { ReactElement } from 'react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import ClientPlugin from './client-plugin'

const enableTanStackDevtools = import.meta.env.VITE_ENABLE_TANSTACK_DEVTOOLS === 'true'

export default function DevtoolsExample(): ReactElement | null {
  if (!enableTanStackDevtools) return null

  return (
    <TanStackDevtools
      eventBusConfig={{
        debug: false,
        connectToServerBus: enableTanStackDevtools,
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
          name: 'Client Plugin',
          render: <ClientPlugin />,
        },
      ]}
    />
  )
}
