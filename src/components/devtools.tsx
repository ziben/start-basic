import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import ClientPlugin from './client-plugin'

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
          name: 'Client Plugin',
          render: <ClientPlugin />,
        },
      ]}
    />
  )
}

