import { createServerFn } from '@tanstack/react-start'
import { getWebRequest } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'
import { getSidebarData } from './controller'

/**
 * 获取侧边栏数据的API端点
 * 如果用户已登录，将返回根据用户角色定制的侧边栏数据
 * 否则返回默认的公共侧边栏数据
 */
export const getSidebarDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { headers } = getWebRequest()!
    const session = await auth.api.getSession({ headers })
    const userId = session?.user?.id
    const role = session?.user?.role || 'public'

    // 获取侧边栏数据
    const sidebarData = await getSidebarData(userId, role)
    return sidebarData
  } catch (error) {
    console.error('Error fetching sidebar data:', error)
    throw new Error('Failed to fetch sidebar data')
  }
})
