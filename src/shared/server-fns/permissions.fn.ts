import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { requireUser } from '~/modules/auth/shared/lib/require-auth'

/**
 * 获取当前用户的所有权限
 */
export const getUserPermissionsFn = createServerFn({ method: 'GET' })
  .validator(z.object({ organizationId: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const { getUserPermissions } = await import('~/modules/admin/shared/lib/permission-check')
    const user = await requireUser()
    return getUserPermissions(user.id, data?.organizationId)
  })

/**
 * 检查用户是否有指定权限
 */
export const checkPermissionFn = createServerFn({ method: 'GET' })
  .validator(z.object({ permission: z.string(), organizationId: z.string().optional() }))
  .handler(async ({ data }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/auth/shared/lib/auth')
    const { checkPermission } = await import('~/modules/admin/shared/lib/permission-check')

    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')

    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return false

    return checkPermission(session.user.id, data.permission, {
      organizationId: data.organizationId,
    })
  })
