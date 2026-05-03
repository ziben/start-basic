import type { BetterAuthPlugin } from 'better-auth'
import type { BetterAuthClientPlugin } from 'better-auth/client'

export interface BetterAuthModuleConfig {
  readonly serverPlugins?: readonly BetterAuthPlugin[]
  readonly clientPlugins?: readonly BetterAuthClientPlugin[]
  readonly serverPluginIds?: readonly string[]
  readonly clientPluginIds?: readonly string[]
}

export interface AppModule {
  readonly key: string
  readonly version?: string
  readonly dependencies?: readonly string[]
  readonly betterAuth?: BetterAuthModuleConfig
  readonly exports?: Record<string, unknown>
}

export interface ModuleRegistry<TModules extends readonly AppModule[]> {
  readonly modules: TModules
  getModule<TKey extends TModules[number]['key']>(
    key: TKey
  ): Extract<TModules[number], { readonly key: TKey }>
  getBetterAuthServerPlugins(): BetterAuthPlugin[]
  getBetterAuthClientPlugins(): BetterAuthClientPlugin[]
  getBetterAuthServerPluginIds(): string[]
  getBetterAuthClientPluginIds(): string[]
}

export function defineModule<const TModule extends AppModule>(
  module: TModule
): TModule {
  return module
}

export function createModuleRegistry<const TModules extends readonly AppModule[]>(
  modules: TModules
): ModuleRegistry<TModules> {
  assertUniqueModuleKeys(modules)

  return {
    modules,

    getModule(key) {
      const module = modules.find((item) => item.key === key)

      if (!module) {
        throw new Error(`Module "${String(key)}" is not registered`)
      }

      return module as Extract<TModules[number], { readonly key: typeof key }>
    },

    getBetterAuthServerPlugins() {
      return modules.flatMap((module) => module.betterAuth?.serverPlugins ?? [])
    },

    getBetterAuthClientPlugins() {
      return modules.flatMap((module) => module.betterAuth?.clientPlugins ?? [])
    },

    getBetterAuthServerPluginIds() {
      return modules.flatMap((module) => module.betterAuth?.serverPluginIds ?? [])
    },

    getBetterAuthClientPluginIds() {
      return modules.flatMap((module) => module.betterAuth?.clientPluginIds ?? [])
    },
  }
}

function assertUniqueModuleKeys(modules: readonly AppModule[]): void {
  const seen = new Set<string>()

  for (const module of modules) {
    if (seen.has(module.key)) {
      throw new Error(`Duplicate module key "${module.key}"`)
    }

    seen.add(module.key)
  }
}
