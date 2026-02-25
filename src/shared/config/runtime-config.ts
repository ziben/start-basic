import { getDb } from '../lib/db'

export type RuntimeConfigShape = {
  'log.requestBody.enabled': boolean
  'log.dir': string
  'log.system.sampleRate': number
  'log.system.sampleLevels': string[]
  'log.maxBodyBytes': number
  'ai.enabled': boolean
  'ai.provider': 'gemini' | 'openai' | 'deepseek' | 'qwen' | 'zhipu' | 'ernie'
  'ai.model': string
  'auth.trustedOrigins': string[]
}

export type RuntimeConfigKey = keyof RuntimeConfigShape

const CACHE_TTL_MS = 60_000

const globalForRuntimeConfig = globalThis as unknown as {
  __runtimeConfig?: {
    loadedAt: number
    values: Map<string, unknown>
    tableUnavailableLogged: boolean
  }
}

function getStore(): {
  loadedAt: number
  values: Map<string, unknown>
  tableUnavailableLogged: boolean
} {
  globalForRuntimeConfig.__runtimeConfig ??= {
    loadedAt: 0,
    values: new Map<string, unknown>(),
    tableUnavailableLogged: false,
  }
  return globalForRuntimeConfig.__runtimeConfig
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback
  return value === 'true'
}

function parseNumber(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseStringArray(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const VALID_PROVIDERS = ['gemini', 'openai', 'deepseek', 'qwen', 'zhipu', 'ernie'] as const
type ValidProvider = (typeof VALID_PROVIDERS)[number]

function getDefaultsFromEnv(): RuntimeConfigShape {
  const rawProvider = process.env.AI_PROVIDER ?? 'gemini'
  const provider: ValidProvider = (VALID_PROVIDERS as readonly string[]).includes(rawProvider)
    ? (rawProvider as ValidProvider)
    : 'gemini'

  return {
    'log.requestBody.enabled': parseBoolean(process.env.LOG_REQUEST_BODY, false),
    'log.dir': process.env.LOG_DIR || 'logs',
    'log.system.sampleRate': parseNumber(process.env.SYSTEM_LOG_SAMPLE_RATE, 1),
    'log.system.sampleLevels': parseStringArray(process.env.SYSTEM_LOG_SAMPLE_LEVELS, ['info']),
    'log.maxBodyBytes': parseNumber(process.env.LOG_MAX_BODY_BYTES, 8 * 1024),
    'ai.enabled': parseBoolean(process.env.ENABLE_AI, false),
    'ai.provider': provider,
    'ai.model': process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
    'auth.trustedOrigins': parseStringArray(process.env.BETTER_AUTH_TRUSTED_ORIGINS, []),
  }
}

function normalizeValue<K extends RuntimeConfigKey>(key: K, raw: unknown): RuntimeConfigShape[K] {
  const defaults = getDefaultsFromEnv()

  switch (key) {
    case 'log.requestBody.enabled':
    case 'ai.enabled': {
      if (typeof raw === 'boolean') return raw as RuntimeConfigShape[K]
      if (typeof raw === 'string') return (raw === 'true') as RuntimeConfigShape[K]
      return defaults[key]
    }
    case 'log.system.sampleRate':
    case 'log.maxBodyBytes': {
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw as RuntimeConfigShape[K]
      if (typeof raw === 'string') {
        const n = Number(raw)
        if (Number.isFinite(n)) return n as RuntimeConfigShape[K]
      }
      return defaults[key]
    }
    case 'log.system.sampleLevels':
    case 'auth.trustedOrigins': {
      const fallback = defaults[key] as string[]
      if (Array.isArray(raw)) {
        return raw.map(String) as RuntimeConfigShape[K]
      }
      if (typeof raw === 'string') {
        return parseStringArray(raw, fallback) as RuntimeConfigShape[K]
      }
      return fallback as RuntimeConfigShape[K]
    }
    case 'ai.provider': {
      if ((VALID_PROVIDERS as readonly unknown[]).includes(raw)) return raw as RuntimeConfigShape[K]
      return defaults[key]
    }
    case 'log.dir':
    case 'ai.model': {
      if (typeof raw === 'string' && raw.length > 0) return raw as RuntimeConfigShape[K]
      return defaults[key]
    }
    default:
      return defaults[key]
  }
}

function parseDbValue(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

type DbConfigRow = {
  key: string
  value: string
}

export async function initRuntimeConfig(options?: { force?: boolean }): Promise<void> {
  const store = getStore()
  const now = Date.now()

  if (!options?.force && now - store.loadedAt < CACHE_TTL_MS) {
    return
  }

  const defaults = getDefaultsFromEnv()
  store.values = new Map<string, unknown>(Object.entries(defaults))

  try {
    const prisma = await getDb()
    const rows = await prisma.$queryRaw<DbConfigRow[]>`
      SELECT "key", "value"
      FROM "system_config"
      WHERE "isEnabled" = TRUE
    `

    for (const row of rows) {
      if (!(row.key in defaults)) continue
      const parsed = parseDbValue(row.value)
      store.values.set(row.key, parsed)
    }
    store.loadedAt = now
  } catch (error) {
    store.loadedAt = now
    if (!store.tableUnavailableLogged) {
      store.tableUnavailableLogged = true
      console.warn(`[runtime-config] Falling back to ENV/defaults: ${String(error)}`)
    }
  }
}

export function getRuntimeConfig<K extends RuntimeConfigKey>(key: K): RuntimeConfigShape[K] {
  const store = getStore()
  const raw = store.values.has(key) ? store.values.get(key) : getDefaultsFromEnv()[key]
  return normalizeValue(key, raw)
}

export async function refreshRuntimeConfig(): Promise<{ refreshedAt: number }> {
  await initRuntimeConfig({ force: true })
  return { refreshedAt: getStore().loadedAt }
}

export function getPublicRuntimeConfig(): Pick<
  RuntimeConfigShape,
  'ai.enabled' | 'ai.provider' | 'ai.model'
> {
  return {
    'ai.enabled': getRuntimeConfig('ai.enabled'),
    'ai.provider': getRuntimeConfig('ai.provider'),
    'ai.model': getRuntimeConfig('ai.model'),
  }
}
