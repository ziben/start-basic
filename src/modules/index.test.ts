import { describe, expect, it } from 'vitest'
import { auditModule, authModule, healthModule, moduleRegistry, paymentModule } from './index'

describe('moduleRegistry', () => {
  it('registers auth, payment, health, and audit explicitly', () => {
    expect(moduleRegistry.modules).toEqual([authModule, paymentModule, healthModule, auditModule])
    expect(moduleRegistry.getModule('payment')).toBe(paymentModule)
    expect(moduleRegistry.getModule('payment').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('health')).toBe(healthModule)
    expect(moduleRegistry.getModule('health').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('audit')).toBe(auditModule)
    expect(moduleRegistry.getModule('audit').dependencies).toContain('auth')
  })
})
