import { createServerFn } from '@tanstack/react-start'

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(async () => {
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/auth/shared/lib/auth')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    return session?.user || null
})
