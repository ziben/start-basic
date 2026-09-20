import { getRequestHeaders } from '@tanstack/react-start/server'
import { ServiceError } from '~/shared/utils/service-error'
import { auth } from './auth'

export async function requireSession() {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session?.user) throw new ServiceError('UNAUTHORIZED')
  return session
}
export async function requireUser() {
  return (await requireSession()).user
}
