import { z } from 'zod'
import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'
import type { SerializableSidebarData } from '~/components/layout/types'
import type { SidebarScope } from './sidebar-data-loader'

export const loadSidebarData = createServerOnlyFn(async (scope: SidebarScope): Promise<SerializableSidebarData> => {
  const server = await import('./sidebar-data-loader')
  return server.loadSidebarData(scope)
})

export const getSidebarDataFn = createServerFn({ method: 'GET' })
  .validator(z.enum(['APP', 'ADMIN']).optional())
  .handler(async ({ data }): Promise<SerializableSidebarData> => {
    const scope: SidebarScope = data === 'ADMIN' ? 'ADMIN' : 'APP'
    return loadSidebarData(scope)
  })
