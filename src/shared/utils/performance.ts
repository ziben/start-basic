/**
 * 性能监控工具
 */

const isDev = import.meta.env.DEV

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
}

// 内存中存储指标
const metrics: PerformanceMetric[] = []

/**
 * 记录性能指标
 */
export function recordMetric(name: string, value: number) {
  const metric: PerformanceMetric = {
    name,
    value,
    timestamp: Date.now(),
  }

  metrics.push(metric)

  // 开发环境打印日志
  if (isDev) {
    console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`)
  }

  // 限制存储数量
  if (metrics.length > 100) {
    metrics.shift()
  }
}

/**
 * 获取所有指标
 */
export function getMetrics(): PerformanceMetric[] {
  return [...metrics]
}

/**
 * 清除所有指标
 */
export function clearMetrics() {
  metrics.length = 0
}

/**
 * 测量函数执行时间
 */
export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const startMark = `${name}_start`
  const endMark = `${name}_end`

  mark(startMark)
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const duration = performance.now() - start
    mark(endMark)
    measureBetweenMarks(name, startMark, endMark)
    recordMetric(name, duration)
  }
}

/**
 * 测量同步函数执行时间
 */
export function measureSync<T>(name: string, fn: () => T): T {
  const startMark = `${name}_start`
  const endMark = `${name}_end`

  mark(startMark)
  const start = performance.now()
  try {
    return fn()
  } finally {
    const duration = performance.now() - start
    mark(endMark)
    measureBetweenMarks(name, startMark, endMark)
    recordMetric(name, duration)
  }
}

/**
 * 获取 Web Vitals 指标
 */
export function getWebVitals() {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined

  if (!navigation) return null

  return {
    // DNS 解析时间
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    // TCP 连接时间
    tcp: navigation.connectEnd - navigation.connectStart,
    // 首字节时间 (TTFB)
    ttfb: navigation.responseStart - navigation.requestStart,
    // DOM 解析时间
    domParse: navigation.domContentLoadedEventEnd - navigation.responseEnd,
    // 页面完全加载时间
    loadComplete: navigation.loadEventEnd - navigation.startTime,
    // DOM Interactive
    domInteractive: navigation.domInteractive - navigation.startTime,
  }
}

/**
 * 报告 Web Vitals
 */
export function reportWebVitals() {
  if (typeof window === 'undefined') return
  const sent = new Set<string>()
  const emit = (name: string, value: number) => {
    if (sent.has(name) || !Number.isFinite(value) || value < 0) return
    sent.add(name)
    recordMetric(name, value)
    const body = JSON.stringify({ name, value })
    // 指标不包含 URL、用户标识或页面内容；采集失败不影响页面。
    void fetch('/api/metrics', {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {})
  }
  const observers: PerformanceObserver[] = []
  let lcp: number | undefined
  if (typeof PerformanceObserver !== 'undefined') {
    for (const type of ['paint', 'largest-contentful-paint']) {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') emit('FCP', entry.startTime)
          if (entry.entryType === 'largest-contentful-paint') lcp = entry.startTime
        }
      })
      observer.observe({ type, buffered: true })
      observers.push(observer)
    }
  }
  const finishLcp = () => {
    if (lcp !== undefined) emit('LCP', lcp)
  }
  const onHidden = () => {
    if (document.visibilityState === 'hidden') finishLcp()
  }
  const onLoad = () => {
    const vitals = getWebVitals()
    if (vitals) {
      emit('TTFB', vitals.ttfb)
      emit('LOAD', vitals.loadComplete)
    }
  }
  // React hydration 可能晚于 load 事件。
  const timer = window.setTimeout(() => {
    if (document.readyState === 'complete') onLoad()
  }, 0)
  const loaded = () => window.setTimeout(onLoad, 0)
  window.addEventListener('load', loaded, { once: true })
  window.addEventListener('pagehide', finishLcp)
  window.addEventListener('pointerdown', finishLcp, { once: true })
  window.addEventListener('keydown', finishLcp, { once: true })
  document.addEventListener('visibilitychange', onHidden)
  return () => {
    clearTimeout(timer)
    observers.forEach((observer) => observer.disconnect())
    window.removeEventListener('load', loaded)
    window.removeEventListener('pagehide', finishLcp)
    window.removeEventListener('pointerdown', finishLcp)
    window.removeEventListener('keydown', finishLcp)
    document.removeEventListener('visibilitychange', onHidden)
  }
}

/**
 * 创建性能标记
 */
export function mark(name: string) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name)
  }
}

/**
 * 测量两个标记之间的时间
 */
export function measureBetweenMarks(name: string, startMark: string, endMark: string) {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark)
      const entries = performance.getEntriesByName(name, 'measure')
      if (entries.length > 0) {
        recordMetric(name, entries[entries.length - 1].duration)
      }
    } catch {
      // 标记可能不存在
    }
  }
}
