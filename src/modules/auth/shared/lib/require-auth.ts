import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './auth'
export async function requireSession() { const session = await auth.api.getSession({ headers: getRequestHeaders() }); if (!session?.user) throw new Error('未登录'); return session }
export async function requireUser() { return (await requireSession()).user }
