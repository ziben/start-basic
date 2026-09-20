import { isNotFound, isRedirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { toSafeError } from '~/shared/utils/service-error'

export async function handleServerErrors<T>({ next }: { next: () => Promise<T> }): Promise<T> {
  try {
    return await next()
  } catch (error) {
    if (error instanceof Response || isRedirect(error) || isNotFound(error)) throw error
    const safe = toSafeError(error)
    if (safe.status === 500) console.error('[ServerFn]', error)
    // A plain object retains its error code across the Server Function transport.
    throw safe
  }
}

export const serverErrorMiddleware = createMiddleware({ type: 'function' }).server(handleServerErrors)
