import { useCallback, useEffect, useRef, useState } from 'react'
import { isModernBrowser } from '@/shared/utils/browser-detect'

interface DynamicCSSLoaderProps {
  modernUrl: string
  legacyUrl: string
  onReady?: () => void
}

/**
 * 客户端动态加载 CSS
 * 避免 SSR hydration 不匹配,在客户端检测浏览器能力后动态替换 CSS
 */
export function DynamicCSSLoader({ modernUrl, legacyUrl, onReady }: DynamicCSSLoaderProps): null {
  const onReadyRef = useRef(onReady)

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const shouldUseLegacy = !isModernBrowser()

    if (shouldUseLegacy) {
      const existingLink = document.querySelector<HTMLLinkElement>(
        `link[rel="stylesheet"][href="${modernUrl}"]`
      )

      if (existingLink) {
        const legacyLink = document.createElement('link')
        legacyLink.rel = 'stylesheet'
        legacyLink.href = legacyUrl

        legacyLink.onload = () => {
          existingLink.remove()
          console.log('已切换到 legacy CSS')
          onReadyRef.current?.()
        }

        legacyLink.onerror = () => {
          console.error('Legacy CSS 加载失败,继续使用 modern CSS')
          onReadyRef.current?.()
        }

        document.head.appendChild(legacyLink)
      } else {
        onReadyRef.current?.()
      }
    } else {
      onReadyRef.current?.()
    }
  }, [modernUrl, legacyUrl])

  return null
}

/**
 * 使用 CSS 加载状态的 Hook
 * 优化版本:消除竞态条件,简化逻辑
 */
export function useCSSReady(): { isReady: boolean; handleReady: () => void } {
  const [isReady, setIsReady] = useState(false)

  const handleReady = useCallback(() => {
    setIsReady(true)
  }, [])

  return { isReady, handleReady }
}
