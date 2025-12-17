/**
 * 统一日志工具
 * 支持不同日志级别和环境控制
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: unknown
  context?: string
}

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

// 日志级别权重
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// 当前最低日志级别 (生产环境只显示 warn 和 error)
const MIN_LOG_LEVEL: LogLevel = isProd ? 'warn' : 'debug'

// 日志颜色
const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#9CA3AF',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
}

/**
 * 格式化时间戳
 */
function formatTimestamp(): string {
  return new Date().toISOString()
}

/**
 * 是否应该记录此级别的日志
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL]
}

/**
 * 格式化日志输出
 */
function formatLog(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
  ]
  
  if (entry.context) {
    parts.push(`[${entry.context}]`)
  }
  
  parts.push(entry.message)
  
  return parts.join(' ')
}

/**
 * 输出日志到控制台
 */
function logToConsole(entry: LogEntry) {
  if (typeof console === 'undefined') return
  
  const formatted = formatLog(entry)
  const color = LOG_COLORS[entry.level]
  
  let consoleMethod = console.log
  if (entry.level === 'error') {
    consoleMethod = console.error
  } else if (entry.level === 'warn') {
    consoleMethod = console.warn
  }

  if (isDev && typeof globalThis.window !== 'undefined') {
    // 浏览器环境使用彩色输出
    consoleMethod(`%c${formatted}`, `color: ${color}`)
  } else {
    consoleMethod(formatted)
  }
  
  if (entry.data !== undefined) {
    consoleMethod(entry.data)
  }
}

/**
 * 创建日志条目
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  data?: unknown,
  context?: string
): LogEntry {
  return {
    level,
    message,
    timestamp: formatTimestamp(),
    data,
    context,
  }
}

/**
 * 日志记录器类
 */
class Logger {
  private readonly context?: string

  constructor(context?: string) {
    this.context = context
  }

  /**
   * 创建带上下文的子日志器
   */
  child(context: string): Logger {
    return new Logger(this.context ? `${this.context}:${context}` : context)
  }

  /**
   * Debug 级别日志
   */
  debug(message: string, data?: unknown) {
    if (!shouldLog('debug')) return
    const entry = createLogEntry('debug', message, data, this.context)
    logToConsole(entry)
  }

  /**
   * Info 级别日志
   */
  info(message: string, data?: unknown) {
    if (!shouldLog('info')) return
    const entry = createLogEntry('info', message, data, this.context)
    logToConsole(entry)
  }

  /**
   * Warn 级别日志
   */
  warn(message: string, data?: unknown) {
    if (!shouldLog('warn')) return
    const entry = createLogEntry('warn', message, data, this.context)
    logToConsole(entry)
  }

  /**
   * Error 级别日志
   */
  error(message: string, error?: unknown) {
    if (!shouldLog('error')) return
    const entry = createLogEntry('error', message, error, this.context)
    logToConsole(entry)
  }

  /**
   * 计时开始
   */
  time(label: string) {
    if (!isDev) return
    console.time(`[${this.context || 'Timer'}] ${label}`)
  }

  /**
   * 计时结束
   */
  timeEnd(label: string) {
    if (!isDev) return
    console.timeEnd(`[${this.context || 'Timer'}] ${label}`)
  }

  /**
   * 分组日志开始
   */
  group(label: string) {
    if (!isDev) return
    console.group(`[${this.context || 'Group'}] ${label}`)
  }

  /**
   * 分组日志结束
   */
  groupEnd() {
    if (!isDev) return
    console.groupEnd()
  }
}

// 默认日志器
export const logger = new Logger()

// 预定义的日志器
export const apiLogger = new Logger('API')
export const authLogger = new Logger('Auth')
export const routerLogger = new Logger('Router')
export const queryLogger = new Logger('Query')

// 导出类供创建自定义日志器
export { Logger }

// 导出类型
export type { LogLevel, LogEntry }
