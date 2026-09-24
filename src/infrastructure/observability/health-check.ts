export type DependencyStatus = 'ok' | 'degraded' | 'skipped'

export type DependencyHealth = {
  status: DependencyStatus
  durationMs?: number
  details?: string
}

export type ReadinessReport = {
  status: 'ready' | 'not_ready'
  dependencies: {
    database: DependencyHealth
    cache: DependencyHealth
    ai: DependencyHealth
    payment: DependencyHealth
  }
}

export type ReadinessOptions = {
  env?: NodeJS.ProcessEnv
  databaseCheck?: () => Promise<void>
}

const AI_ENV_KEYS = {
  gemini: 'GOOGLE_API_KEY',
  openai: 'OPENAI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  qwen: 'QWEN_API_KEY',
  zhipu: 'ZHIPU_API_KEY',
  ernie: 'ERNIE_API_KEY',
} as const

const PAYMENT_ENV_KEYS = [
  'WECHAT_APP_ID',
  'WECHAT_PAY_MCH_ID',
  'WECHAT_PAY_API_V3_KEY',
  'WECHAT_PAY_PRIVATE_KEY_PATH',
  'WECHAT_PAY_PUBLIC_KEY_PATH',
  'WECHAT_PAY_NOTIFY_URL',
]

const CACHE_ENV_KEYS = ['REDIS_URL', 'UPSTASH_REDIS_REST_URL', 'CACHE_URL']
const HEALTHCHECK_TIMEOUT_MS = 2000

function hasValue(env: NodeJS.ProcessEnv, key: string): boolean {
  return Boolean(env[key]?.trim())
}

function configurationHealth(env: NodeJS.ProcessEnv, requiredKeys: string[]): DependencyHealth {
  const configured = requiredKeys.filter((key) => hasValue(env, key))
  if (configured.length === 0) return { status: 'skipped', details: 'not configured' }
  if (configured.length === requiredKeys.length) return { status: 'ok' }

  return {
    status: 'degraded',
    details: `missing: ${requiredKeys.filter((key) => !hasValue(env, key)).join(', ')}`,
  }
}

async function httpHealth(url: string, headers?: Record<string, string>): Promise<DependencyHealth> {
  const startedAt = performance.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), HEALTHCHECK_TIMEOUT_MS)

  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    const durationMs = Math.round(performance.now() - startedAt)
    if (response.ok) return { status: 'ok', durationMs }
    if (response.status === 401 || response.status === 403) {
      return { status: 'degraded', durationMs, details: 'unauthorized' }
    }
    return { status: 'degraded', durationMs, details: `http_${response.status}` }
  } catch {
    return { status: 'degraded', durationMs: Math.round(performance.now() - startedAt), details: 'unavailable' }
  } finally {
    clearTimeout(timeout)
  }
}

async function defaultDatabaseCheck() {
  const { getDb } = await import('../db/prisma-client')
  const db = await getDb()
  await db.$queryRaw`SELECT 1`
}

async function databaseHealth(check: () => Promise<void>): Promise<DependencyHealth> {
  const startedAt = performance.now()
  try {
    await check()
    return { status: 'ok', durationMs: Math.round(performance.now() - startedAt) }
  } catch {
    // Do not expose connection strings, driver errors, or credentials from a probe endpoint.
    return {
      status: 'degraded',
      durationMs: Math.round(performance.now() - startedAt),
      details: 'unavailable',
    }
  }
}

async function aiHealth(env: NodeJS.ProcessEnv): Promise<DependencyHealth> {
  if (env.ENABLE_AI?.trim().toLowerCase() !== 'true') {
    return { status: 'skipped', details: 'disabled' }
  }

  const provider = (env.AI_PROVIDER?.trim().toLowerCase() || 'gemini') as keyof typeof AI_ENV_KEYS
  const key = AI_ENV_KEYS[provider] ?? AI_ENV_KEYS.gemini
  const health = configurationHealth(env, [key])
  if (health.status === 'skipped') return { status: 'degraded', details: `missing: ${key}` }

  if (provider === 'gemini') {
    return httpHealth(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(env[key]!)}`)
  }

  const baseUrl =
    provider === 'openai'
      ? env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
      : env[`${provider.toUpperCase()}_BASE_URL`] ||
        ({
          deepseek: 'https://api.deepseek.com/v1',
          qwen: 'https://dashscope.aliyuncs.com/api/v2/apps/protocols/compatible-mode/v1',
          zhipu: 'https://open.bigmodel.cn/api/paas/v4',
          ernie: 'https://qianfan.baidubce.com/v2',
        }[provider] ?? '')
  return httpHealth(`${baseUrl.replace(/\/$/, '')}/models`, { authorization: `Bearer ${env[key]}` })
}

async function cacheHealth(env: NodeJS.ProcessEnv): Promise<DependencyHealth> {
  const restUrl = env.UPSTASH_REDIS_REST_URL?.trim()
  if (restUrl) {
    const token = env.UPSTASH_REDIS_REST_TOKEN?.trim()
    if (!token) return { status: 'degraded', details: 'missing: UPSTASH_REDIS_REST_TOKEN' }
    return httpHealth(restUrl, { authorization: `Bearer ${token}` })
  }

  const configured = CACHE_ENV_KEYS.find((key) => hasValue(env, key))
  return configured
    ? { status: 'skipped', details: 'configured; native cache probe unavailable' }
    : { status: 'skipped', details: 'in-memory' }
}

function paymentHealth(env: NodeJS.ProcessEnv): DependencyHealth {
  const health = configurationHealth(env, PAYMENT_ENV_KEYS)
  if (health.status !== 'ok') return health

  for (const key of ['WECHAT_PAY_PRIVATE_KEY_PATH', 'WECHAT_PAY_PUBLIC_KEY_PATH']) {
    if (!existsSync(env[key]!)) return { status: 'degraded', details: `missing_file: ${key}` }
  }
  return { status: 'ok', details: 'configured and certificate files exist' }
}

export async function checkReadiness(options: ReadinessOptions = {}): Promise<ReadinessReport> {
  const env = options.env ?? process.env
  const database = await databaseHealth(options.databaseCheck ?? defaultDatabaseCheck)
  const ai = await aiHealth(env)
  const payment = paymentHealth(env)
  const cache = await cacheHealth(env)
  const ready = database.status === 'ok' && ai.status !== 'degraded' && payment.status !== 'degraded'

  return {
    status: ready ? 'ready' : 'not_ready',
    dependencies: { database, cache, ai, payment },
  }
}

export async function readinessResponse(options?: ReadinessOptions): Promise<Response> {
  const report = await checkReadiness(options)
  return Response.json(report, {
    status: report.status === 'ready' ? 200 : 503,
    headers: { 'cache-control': 'no-store' },
  })
}
import { existsSync } from 'node:fs'
