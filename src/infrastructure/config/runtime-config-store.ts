import {
  buildRuntimeConfigDefaults,
  normalizeRuntimeConfigValue,
  type RuntimeConfigKey,
  type RuntimeConfigShape,
} from './runtime-config-defaults'

const CACHE_TTL_MS = 60_000

type RuntimeConfigState = {
  loadedAt: number
  values: Map<string, unknown>
  tableUnavailableLogged: boolean
}

type DbConfigRow = {
  key: string
  value: string
}

type RuntimeConfigDb = {
  $queryRaw<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>
}

export type RuntimeConfigStoreOptions = {
  env?: NodeJS.ProcessEnv
  getDb?: () => Promise<RuntimeConfigDb>
  now?: () => number
  warn?: (message: string) => void
  state?: RuntimeConfigState
}

export type RuntimeConfigStore = {
  load(loadOptions?: { force?: boolean }): Promise<void>
  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigShape[K]
  refresh(): Promise<{ refreshedAt: number }>
}

const globalForRuntimeConfig = globalThis as unknown as {
  __runtimeConfig?: RuntimeConfigState
}

function getGlobalState(): RuntimeConfigState {
  globalForRuntimeConfig.__runtimeConfig ??= {
    loadedAt: 0,
    values: new Map<string, unknown>(),
    tableUnavailableLogged: false,
  }
  return globalForRuntimeConfig.__runtimeConfig
}

function parseDbValue(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

async function getDefaultDb(): Promise<RuntimeConfigDb> {
  const db = await import('~/shared/lib/db')
  return db.getDb()
}

export function createRuntimeConfigStore(options: RuntimeConfigStoreOptions = {}): RuntimeConfigStore {
  const state = options.state ?? getGlobalState()
  const env = options.env ?? process.env
  const getDb = options.getDb ?? getDefaultDb
  const now = options.now ?? Date.now
  const warn = options.warn ?? console.warn

  return {
    async load(loadOptions?: { force?: boolean }): Promise<void> {
      const currentTime = now()

      if (!loadOptions?.force && state.loadedAt > 0 && currentTime - state.loadedAt < CACHE_TTL_MS) {
        return
      }

      const defaults = buildRuntimeConfigDefaults(env)
      state.values = new Map<string, unknown>(Object.entries(defaults))

      try {
        const prisma = await getDb()
        const rows = await prisma.$queryRaw<DbConfigRow[]>`
          SELECT "key", "value"
          FROM "system_config"
          WHERE "isEnabled" = TRUE
        `

        for (const row of rows) {
          if (!(row.key in defaults)) continue
          state.values.set(row.key, parseDbValue(row.value))
        }
        state.loadedAt = currentTime
      } catch (error) {
        state.loadedAt = currentTime
        if (!state.tableUnavailableLogged) {
          state.tableUnavailableLogged = true
          warn(`[runtime-config] Falling back to ENV/defaults: ${String(error)}`)
        }
      }
    },

    get<K extends RuntimeConfigKey>(key: K): RuntimeConfigShape[K] {
      const defaults = buildRuntimeConfigDefaults(env)
      const raw = state.values.has(key) ? state.values.get(key) : defaults[key]
      return normalizeRuntimeConfigValue(key, raw, defaults)
    },

    async refresh(): Promise<{ refreshedAt: number }> {
      await this.load({ force: true })
      return { refreshedAt: state.loadedAt }
    },
  }
}
