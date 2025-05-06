import { authClient } from '@/lib/auth-client';

import { AnyRoute, redirect } from '@tanstack/react-router';
import { registerGlobalMiddleware } from '@tanstack/react-start';
import { logMiddleware } from './utils/loggingMiddleware';

registerGlobalMiddleware({
  middleware: [logMiddleware],
})

// 全局中间件，用于检查用户认证和权限
export const authMiddleware = async (route: AnyRoute) => {

    const sessionResponse = await authClient.getSession();
    console.log(sessionResponse)
    console.log(!sessionResponse.data)
    if (!sessionResponse || !sessionResponse.data) {
      // 如果用户未登录，重定向到登录页面
      console.log('未登录')
      throw redirect({ to: '/sign-in' })
    }
    // 这里可以添加权限检查逻辑
    // 例如：检查用户角色是否符合路由要求
    // if (!hasRequiredRole(sessionResponse.data.user, route)) {
    //   navigate({ to: '/unauthorized', replace: true });
    //   throw new Error('Unauthorized');
    // }
};
