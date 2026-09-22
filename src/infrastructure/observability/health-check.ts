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

function aiHealth(env: NodeJS.ProcessEnv): DependencyHealth {
  if (env.ENABLE_AI?.trim().toLowerCase() !== 'true') {
    return { status: 'skipped', details: 'disabled' }
  }

  const provider = (env.AI_PROVIDER?.trim().toLowerCase() || 'gemini') as keyof typeof AI_ENV_KEYS
  const key = AI_ENV_KEYS[provider] ?? AI_ENV_KEYS.gemini
  const health = configurationHealth(env, [key])
  return health.status === 'skipped' ? { status: 'degraded', details: `missing: ${key}` } : health
}

function cacheHealth(env: NodeJS.ProcessEnv): DependencyHealth {
  const configured = CACHE_ENV_KEYS.find((key) => hasValue(env, key))
  return configured ? { status: 'ok', details: 'configured' } : { status: 'skipped', details: 'in-memory' }
}

export async function checkReadiness(options: ReadinessOptions = {}): Promise<ReadinessReport> {
  const env = options.env ?? process.env
  const database = await databaseHealth(options.databaseCheck ?? defaultDatabaseCheck)
  const ai = aiHealth(env)
  const payment = configurationHealth(env, PAYMENT_ENV_KEYS)
  const cache = cacheHealth(env)
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
