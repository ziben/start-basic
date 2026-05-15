import { describe, expect, it } from 'vitest'
import { moduleRegistry } from './index'
import { moduleDiagnostics } from './module-diagnostics'
import {
  getModuleDiagnosticsIssues,
  getModuleDiagnosticsRecommendations,
  getModuleIssueCount,
} from './module-diagnostics-logic'

describe('moduleDiagnostics', () => {
  it('keeps client-safe module diagnostics aligned with the registered modules', () => {
    expect(moduleDiagnostics.map((module) => module.key)).toEqual(moduleRegistry.modules.map((module) => module.key))
  })

  it('keeps better-auth server and client plugin ids separated', () => {
    const authDiagnostics = moduleDiagnostics.find((module) => module.key === 'auth')

    expect(authDiagnostics?.betterAuthServerPluginIds).toEqual(
      moduleRegistry.getModule('auth').betterAuth?.serverPluginIds
    )
    expect(authDiagnostics?.betterAuthClientPluginIds).toEqual(
      moduleRegistry.getModule('auth').betterAuth?.clientPluginIds
    )
  })

  it('registers audit as the shared log capability module', () => {
    const auditDiagnostics = moduleDiagnostics.find((module) => module.key === 'audit')

    expect(auditDiagnostics?.dependencies).toEqual(moduleRegistry.getModule('audit').dependencies)
    expect(auditDiagnostics?.exports).toEqual([
      {
        name: 'services',
        keys: ['LogService', 'writeAuditLog', 'writeSystemLog'],
      },
    ])
  })

  it('reports actionable recommendations for broken module contracts', () => {
    const issues = getModuleDiagnosticsIssues([
      {
        key: 'broken',
        dependencies: ['missing'],
        exports: [
          {
            name: 'services',
            keys: ['run', 'run'],
          },
        ],
        betterAuthServerPluginIds: ['admin', 'admin'],
        betterAuthClientPluginIds: [],
      },
    ])

    expect(getModuleIssueCount(issues)).toBe(3)
    expect(getModuleDiagnosticsRecommendations(issues).map((item) => item.id)).toEqual([
      'missing-dependencies',
      'duplicate-exports',
      'duplicate-plugin-ids',
    ])
  })
})
