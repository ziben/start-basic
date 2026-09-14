// 每个进程独立累计；多实例统计按日志中的单次请求聚合。
let requests = 0
let errors = 0

export function recordRequest(status: number, durationMs: number, method: string) {
  requests++
  if (status >= 500) errors++
  const metric = {
    event: 'http_request',
    timestamp: new Date().toISOString(),
    method,
    status,
    durationMs,
    requests,
    errors,
    errorRate: errors / requests,
  }
  console.info(JSON.stringify(metric))
  return metric
}

export function recordSlowQuery(durationMs: number, thresholdMs = 200) {
  if (durationMs < thresholdMs) return false
  // 不记录 SQL、参数或连接信息，避免把业务数据写入日志。
  console.warn(JSON.stringify({ event: 'slow_query', timestamp: new Date().toISOString(), durationMs, thresholdMs }))
  return true
}
