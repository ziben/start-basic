/**
 * 检测是否在微信环境中
 */
export function isWechat(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return /micromessenger/.test(ua)
}

/**
 * 服务端 UA 判定（仅基于 user-agent）
 * 保守策略：可疑/旧 UA 走 legacy
 */
export function isModernBrowserServer(userAgent?: string | null): boolean {
  if (!userAgent) return true
  const ua = userAgent.toLowerCase()

  if (ua.includes('wechatdevtools')) return false
  if (ua.includes('msie') || ua.includes('trident/')) return false

  return true
}

/**
 * 检测是否在微信开发者工具中
 */
export function isWechatDevTools(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  // 微信开发者工具的 UA 包含 wechatdevtools
  return /wechatdevtools/.test(ua)
}

/**
 * 检测浏览器是否支持现代 CSS 特性
 */
export function isModernBrowser(): boolean {
  if (typeof window === 'undefined') return true // SSR 默认返回 true

  // 微信开发者工具使用 legacy CSS（兼容性更好）
  if (isWechatDevTools()) return false

  // 检测关键的现代浏览器特性
  const checks = [
    // CSS Nesting
    () => CSS.supports('selector(:is(a))'),
    // CSS Custom Properties
    () => CSS.supports('--custom: value'),
    // CSS Grid
    () => CSS.supports('display', 'grid'),
  ]

  return checks.every((check) => {
    try {
      return check()
    } catch {
      return false
    }
  })
}

/**
 * 获取应该使用的 CSS 文件 URL
 */
export function getCSSUrl(modernUrl: string, legacyUrl: string): string {
  if (typeof window !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase()
    console.log('Browser UA:', ua)
    console.log('Is Wechat:', isWechat())
    console.log('Is Wechat DevTools:', isWechatDevTools())
    console.log('Is Modern Browser:', isModernBrowser())
  }
  return isModernBrowser() ? modernUrl : legacyUrl
}
