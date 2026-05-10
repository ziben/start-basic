import { describe, expect, it } from 'vitest'
import { moduleRegistry } from './index'
import { moduleDiagnostics } from './module-diagnostics'

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
})
