import { createServerFn } from '@tanstack/react-start'

export const getSidebarDataFn = createServerFn({ method: 'GET' }).handler(async ({ data }: { data?: unknown }) => {
  const { getRequest } = await import('@tanstack/react-start/server')
  const { auth } = await import('~/modules/identity/shared/lib/auth')
  const { getSidebarData } = await import('./server-utils')

  const rawScope =
    typeof data === 'string' ? data : data && typeof data === 'object' ? (data as { scope?: unknown }).scope : undefined

  const scope: 'APP' | 'ADMIN' = rawScope === 'ADMIN' ? 'ADMIN' : 'APP'

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



