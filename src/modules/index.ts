import { createModuleRegistry } from '~/core/module-registry'
import { authModule } from './auth/module'

export const moduleRegistry = createModuleRegistry([authModule] as const)

export type AppModuleRegistry = typeof moduleRegistry

export { authModule }
