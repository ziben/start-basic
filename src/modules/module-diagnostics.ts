import type { AppModule } from '../core/module-registry'
import { moduleRegistry } from './index'

export type ModuleDiagnosticsExportGroup = { name: string; keys: string[] }
export type ModuleDiagnosticsItem = {
  key: string
  version?: string
  dependencies: string[]
  exports: ModuleDiagnosticsExportGroup[]
  betterAuthServerPluginIds: string[]
  betterAuthClientPluginIds: string[]
}
export const moduleDiagnostics: ModuleDiagnosticsItem[] = (moduleRegistry.modules as readonly AppModule[]).map(
  (module) => ({
    key: module.key,
    version: module.version,
    dependencies: [...(module.dependencies ?? [])],
    exports: Object.entries(module.exports ?? {}).map(([name, value]) => ({
      name,
      keys: value && typeof value === 'object' ? Object.keys(value) : [],
    })),
    betterAuthServerPluginIds: [...(module.betterAuth?.serverPluginIds ?? [])],
    betterAuthClientPluginIds: [...(module.betterAuth?.clientPluginIds ?? [])],
  })
)
