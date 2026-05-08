import { createModuleRegistry } from '~/core/module-registry'
import { authModule } from './auth/module'
import { healthModule } from './health/module'
import { paymentModule } from './payment/module'

export const moduleRegistry = createModuleRegistry([authModule, paymentModule, healthModule] as const)

export type AppModuleRegistry = typeof moduleRegistry

export { authModule }
export { healthModule }
export { paymentModule }
export { appEventBus, createAppEventBus } from './events'
export type { AppEventBus, AppEvents } from './events'
