import { createModuleRegistry } from '~/core/module-registry'
import { auditModule } from './audit/module'
import { authModule } from './auth/module'
import { healthModule } from './health/module'
import { navigationModule } from './navigation/module'
import { paymentModule } from './payment/module'

export const moduleRegistry = createModuleRegistry([
  authModule,
  paymentModule,
  healthModule,
  auditModule,
  navigationModule,
] as const)

export type AppModuleRegistry = typeof moduleRegistry

export { authModule }
export { auditModule }
export { healthModule }
export { navigationModule }
export { paymentModule }
export { appEventBus, createAppEventBus } from './events'
export type { AppEventBus, AppEvents } from './events'
