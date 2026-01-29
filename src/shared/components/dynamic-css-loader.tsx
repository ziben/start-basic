import { useEffect, useState } from 'react'
import { isModernBrowser } from '@/shared/utils/browser-detect'

interface DynamicCSSLoaderProps {
  modernUrl: string
  legacyUrl: string
  onReady?: () => void
}

/**
 * 客户端动态加载 CSS
 * 避免 SSR hydration 不匹配，在客户端检测浏览器能力后动态替换 CSS
 */
export function DynamicCSSLoader({ modernUrl, legacyUrl, onReady }: DynamicCSSLoaderProps): null {
  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return

    const shouldUseLegacy = !isModernBrowser()
    
    if (shouldUseLegacy) {
      // 查找现有的 CSS link 标签
      const existingLink = document.querySelector<HTMLLinkElement>(
        `link[rel="stylesheet"][href="${modernUrl}"]`
      )

      if (existingLink) {
        // 创建新的 legacy CSS link
        const legacyLink = document.createElement('link')
        legacyLink.rel = 'stylesheet'
        legacyLink.href = legacyUrl

        // 等待 legacy CSS 加载完成后再移除 modern CSS
        legacyLink.onload = () => {
          existingLink.remove()
          console.log('已切换到 legacy CSS')
          onReady?.()
        }

        legacyLink.onerror = () => {
          console.error('Legacy CSS 加载失败')
          onReady?.() // 即使失败也要显示页面
        }

        // 插入到 head
        document.head.appendChild(legacyLink)
      } else {
        onReady?.()
      }
    } else {
      // 现代浏览器直接就绪
      onReady?.()
    }
  }, [modernUrl, legacyUrl, onReady])

  return null
}

/**
 * 使用 CSS 加载状态的 Hook
 */
export function useCSSReady(): { isReady: boolean; handleReady: () => void } {
  // SSR 和客户端初始状态都为 false，避免 hydration 不匹配
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return

    // 延迟一帧，等待 DynamicCSSLoader 执行
    requestAnimationFrame(() => {
      const shouldUseLegacy = !isModernBrowser()
      if (!shouldUseLegacy) {
        // 现代浏览器立即就绪
        setIsReady(true)
      }
    })
  }, [])

  const handleReady = (): void => setIsReady(true)

  return { isReady, handleReady }
}
