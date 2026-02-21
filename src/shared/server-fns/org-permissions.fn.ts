import { createServerFn } from '@tanstack/react-start'

export const checkOrgPermissionFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { 
    organizationId: string
    resource: string
    action: string 
  }) => data)
  .handler(async ({ data }: { data: { organizationId: string; resource: string; action: string } }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/auth/shared/lib/auth')
    
    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return false
    
    // 使用 better-auth 的 hasOrgPermission API
    try {
      const hasPermission = await auth.api.hasOrgPermission({
        headers: request.headers,
        body: {
          organizationId: data.organizationId,
          permission: {
            [data.resource]: [data.action]
          }
        }
      })
      
      return hasPermission
    } catch (error) {
      console.error('组织权限检查失败:', error)
      return false
    }
  })

export const getOrgRoleFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { organizationId: string }) => data)
  .handler(async ({ data }: { data: { organizationId: string } }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/auth/shared/lib/auth')
    
    const request = getRequest()
    if (!request) throw new Error('无法获取请求信息')
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return null
    
    const prisma = (await import('@/shared/lib/db')).default
    
    const member = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: data.organizationId
      },
      select: { role: true }
    })
    
    return member?.role || null
  })
