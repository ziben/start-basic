import React, { Suspense, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * 默认加载组件
 */
export function DefaultLoadingFallback() {
  return (
    <div className='flex h-full min-h-[200px] w-full items-center justify-center'>
      <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
    </div>
  )
}

/**
 * 全屏加载组件
 */
export function FullPageLoadingFallback() {
  return (
    <div className='flex h-screen w-full items-center justify-center'>
      <Loader2 className='text-muted-foreground h-12 w-12 animate-spin' />
    </div>
  )
}

/**
 * 带 Suspense 的懒加载组件包装器
 */
export function withSuspense<P extends object>(
  LazyComponent: ComponentType<P>,
  Fallback: ComponentType = DefaultLoadingFallback
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

/**
 * 创建懒加载组件
 * @param importFn - 动态 import 函数
 * @param Fallback - 可选的加载组件
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  Fallback: ComponentType = DefaultLoadingFallback
) {
  const LazyComponent = React.lazy(importFn)
  return withSuspense(LazyComponent, Fallback)
}

/**
 * 预加载组件
 * @param importFn - 动态 import 函数
 */
export function preloadComponent(importFn: () => Promise<unknown>) {
  return importFn()
}

/**
 * 资源预加载提示
 */
export function addPreloadHint(href: string, as: 'script' | 'style' | 'image' | 'fetch') {
  if (typeof document === 'undefined') return

  const existing = document.querySelector(`link[href="${href}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  document.head.appendChild(link)
}

/**
 * DNS 预解析
 */
export function addDnsPrefetch(origin: string) {
  if (typeof document === 'undefined') return

  const existing = document.querySelector(`link[href="${origin}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'dns-prefetch'
  link.href = origin
  document.head.appendChild(link)
}
