/**
 * 性能监控工具
 */

const isDev = process.env.NODE_ENV === 'development'

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
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const duration = performance.now() - start
    recordMetric(name, duration)
  }
}

/**
 * 测量同步函数执行时间
 */
export function measureSync<T>(name: string, fn: () => T): T {
  const start = performance.now()
  try {
    return fn()
  } finally {
    const duration = performance.now() - start
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

  // 等待页面加载完成
  window.addEventListener('load', () => {
    // 稍微延迟以确保所有指标都已记录
    setTimeout(() => {
      const vitals = getWebVitals()
      if (vitals && isDev) {
        console.group('[Web Vitals]')
        console.log(`DNS: ${vitals.dns.toFixed(2)}ms`)
        console.log(`TCP: ${vitals.tcp.toFixed(2)}ms`)
        console.log(`TTFB: ${vitals.ttfb.toFixed(2)}ms`)
        console.log(`DOM Parse: ${vitals.domParse.toFixed(2)}ms`)
        console.log(`DOM Interactive: ${vitals.domInteractive.toFixed(2)}ms`)
        console.log(`Load Complete: ${vitals.loadComplete.toFixed(2)}ms`)
        console.groupEnd()
      }
    }, 0)
  })
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
