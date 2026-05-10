export type ModuleDiagnosticsExportGroup = {
  name: string
  keys: string[]
}

export type ModuleDiagnosticsItem = {
  key: string
  version?: string
  dependencies: string[]
  exports: ModuleDiagnosticsExportGroup[]
  betterAuthPluginIds: string[]
}

export const moduleDiagnostics: ModuleDiagnosticsItem[] = [
  {
    key: 'auth',
    version: '1.0.0',
    dependencies: [],
    exports: [
      {
        name: 'runtime',
        keys: ['auth', 'getAuth'],
      },
    ],
    betterAuthPluginIds: [
      'bearer',
      'username',
      'organization',
      'admin',
      'wechat-oauth',
      'user-created-hooks',
      'username',
      'admin',
      'organization',
      'wechat-oauth',
    ],
  },
  {
    key: 'payment',
    version: '1.0.0',
    dependencies: ['auth'],
    exports: [
      {
        name: 'services',
        keys: [
          'createPrepayOrder',
          'queryPaymentOrderStatus',
          'syncPaymentOrderStatus',
          'closePaymentOrder',
        ],
      },
      {
        name: 'events',
        keys: ['orderPaid', 'orderClosed', 'orderFailed'],
      },
    ],
    betterAuthPluginIds: [],
  },
  {
    key: 'health',
    version: '1.0.0',
    dependencies: ['auth'],
    exports: [
      {
        name: 'services',
        keys: ['HealthReportService'],
      },
    ],
    betterAuthPluginIds: [],
  },
]
