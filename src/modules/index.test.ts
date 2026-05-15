import { describe, expect, it } from 'vitest'
import { auditModule, authModule, healthModule, moduleRegistry, navigationModule, paymentModule } from './index'

describe('moduleRegistry', () => {
  it('registers auth, payment, health, audit, and navigation explicitly', () => {
    expect(moduleRegistry.modules).toEqual([authModule, paymentModule, healthModule, auditModule, navigationModule])
    expect(moduleRegistry.getModule('payment')).toBe(paymentModule)
    expect(moduleRegistry.getModule('payment').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('health')).toBe(healthModule)
    expect(moduleRegistry.getModule('health').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('audit')).toBe(auditModule)
    expect(moduleRegistry.getModule('audit').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('navigation')).toBe(navigationModule)
    expect(moduleRegistry.getModule('navigation').dependencies).toContain('auth')
  })
})
