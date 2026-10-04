import { describe, expect, it } from 'vitest'
import {
  auditModule,
  authModule,
  healthModule,
  identityModule,
  moduleRegistry,
  navigationModule,
  organizationModule,
  paymentModule,
  rbacModule,
} from './index'

describe('moduleRegistry', () => {
  it('registers auth, payment, health, identity, audit, navigation, organization, and rbac explicitly', () => {
    expect(moduleRegistry.modules).toEqual([
      authModule,
      paymentModule,
      healthModule,
      identityModule,
      auditModule,
      navigationModule,
      organizationModule,
      rbacModule,
    ])
    expect(moduleRegistry.getModule('payment')).toBe(paymentModule)
    expect(moduleRegistry.getModule('payment').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('health')).toBe(healthModule)
    expect(moduleRegistry.getModule('health').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('identity')).toBe(identityModule)
    expect(moduleRegistry.getModule('identity').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('audit')).toBe(auditModule)
    expect(moduleRegistry.getModule('audit').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('navigation')).toBe(navigationModule)
    expect(moduleRegistry.getModule('navigation').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('organization')).toBe(organizationModule)
    expect(moduleRegistry.getModule('organization').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('rbac')).toBe(rbacModule)
    expect(moduleRegistry.getModule('rbac').dependencies).toContain('auth')
  })
})
