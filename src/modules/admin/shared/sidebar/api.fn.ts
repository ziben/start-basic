import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const getSidebarDataFn = createServerFn({ method: 'GET' })
  .inputValidator(z.enum(['APP', 'ADMIN']).optional())
  .handler(async ({ data }): Promise<any> => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('../../../auth/shared/lib/auth')
    const { getSidebarData } = await import('./server-utils')

    const scope = data === 'ADMIN' ? 'ADMIN' : 'APP'

    try {
      const { headers } = getRequest()!
      const session = await auth.api.getSession({ headers })
      const userId = session?.user?.id
      const role = session?.user?.role || 'public'

      return await getSidebarData(userId, role, scope)
    } catch (error) {
      console.error('Error fetching sidebar data:', error)
      throw new Error('Failed to fetch sidebar data')
    }
  })



