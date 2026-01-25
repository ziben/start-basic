/**
 * Better-Auth 配置
 * 
 * ⚠️ 注意：此文件已迁移到动态加载模式
 * 权限配置现在从数据库加载，而不是硬编码在代码中
 * 
 * 使用方式：
 * ```typescript
 * import { auth } from './auth'
 * // auth 会在首次访问时自动初始化
 * const session = await auth.api.getSession({ headers })
 * ```
 */

import { getAuth as getAuthInstance, initAuth, reinitAuth } from './auth-init'
import { clearAccessControlCache } from './auth-dynamic'

// 导出工具函数
export { initAuth, reinitAuth, clearAccessControlCache }

// 缓存的 auth 实例
let authInstance: Awaited<ReturnType<typeof getAuthInstance>> | null = null

/**
 * 获取 auth 实例（自动初始化）
 */
async function ensureAuth() {
  if (!authInstance) {
    authInstance = await getAuthInstance()
  }
  return authInstance
}

/**
 * 导出 auth 对象，自动处理异步初始化
 * 使用 Proxy 拦截所有属性访问
 */
export const auth = new Proxy({} as any, {
  get(_target, prop) {
    // 特殊处理 api 属性
    if (prop === 'api') {
      return new Proxy({} as any, {
        get(_apiTarget, apiProp) {
          return async (...args: any[]) => {
            const instance = await ensureAuth()
            const method = (instance.api as any)[apiProp]
            if (typeof method === 'function') {
              return method.apply(instance.api, args)
            }
            return method
          }
        },
      })
    }
    
    // 其他属性直接返回异步函数
    return async (...args: any[]) => {
      const instance = await ensureAuth()
      const value = (instance as any)[prop]
      if (typeof value === 'function') {
        return value.apply(instance, args)
      }
      return value
    }
  },
})

// 导出 getAuth 供需要完整实例的地方使用
export async function getAuth() {
  return ensureAuth()
}
