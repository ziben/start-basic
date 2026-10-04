import { createModuleRegistry } from '~/core/module-registry'
import { auditModule } from './audit/module'
import { authModule } from './auth/module'
import { healthModule } from './health/module'
import { identityModule } from './identity/module'
import { navigationModule } from './navigation/module'
import { organizationModule } from './organization/module'
import { paymentModule } from './payment/module'

export const moduleRegistry = createModuleRegistry([
  authModule,
  paymentModule,
  healthModule,
  identityModule,
  auditModule,
  navigationModule,
  organizationModule,
] as const)

export type AppModuleRegistry = typeof moduleRegistry

export { authModule }
export { auditModule }
export { healthModule }
export { identityModule }
export { navigationModule }
export { organizationModule }
export { paymentModule }
export { appEventBus, createAppEventBus } from './events'
export type { AppEventBus, AppEvents } from './events'
