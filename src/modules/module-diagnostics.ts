import type { AppModule } from '../core/module-registry'

export type ModuleDiagnosticsExportGroup = { name: string; keys: string[] }
export type ModuleDiagnosticsItem = {
  key: string
  version?: string
  dependencies: string[]
  exports: ModuleDiagnosticsExportGroup[]
  betterAuthServerPluginIds: string[]
  betterAuthClientPluginIds: string[]
}
// Keep this client-facing manifest free of runtime service imports; parity is checked in module-diagnostics.test.ts.
export const moduleDiagnostics: ModuleDiagnosticsItem[] = [
  {
    key: 'auth',
    version: '1.0.0',
    dependencies: [],
    exports: [{ name: 'runtime', keys: ['auth', 'getAuth'] }],
    betterAuthServerPluginIds: ['bearer', 'username', 'organization', 'admin', 'wechat-oauth', 'user-created-hooks'],
    betterAuthClientPluginIds: ['username', 'admin', 'organization', 'wechat-oauth'],
  },
  {
    key: 'payment',
    version: '1.0.0',
    dependencies: ['auth'],
    exports: [
      {
        name: 'services',
        keys: ['createPrepayOrder', 'queryPaymentOrderStatus', 'syncPaymentOrderStatus', 'closePaymentOrder'],
      },
      { name: 'events', keys: ['orderPaid', 'orderClosed', 'orderFailed'] },
    ],
    betterAuthServerPluginIds: [],
    betterAuthClientPluginIds: [],
  },
  {
    key: 'health',
    version: '1.0.0',
    dependencies: ['auth'],
    exports: [{ name: 'services', keys: ['HealthReportService'] }],
    betterAuthServerPluginIds: [],
    betterAuthClientPluginIds: [],
  },
  {
    key: 'audit',
    version: '1.0.0',
    dependencies: ['auth'],
    exports: [{ name: 'services', keys: ['LogService', 'writeAuditLog', 'writeSystemLog'] }],
    betterAuthServerPluginIds: [],
    betterAuthClientPluginIds: [],
  },
  {
    key: 'navigation',
    version: '1.0.0',
    dependencies: ['auth'],
    exports: [{ name: 'services', keys: ['NavGroupService', 'NavItemService'] }],
    betterAuthServerPluginIds: [],
    betterAuthClientPluginIds: [],
  },
]
