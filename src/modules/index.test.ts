import { describe, expect, it } from 'vitest'
import { authModule, healthModule, moduleRegistry, paymentModule } from './index'

describe('moduleRegistry', () => {
  it('registers auth, payment, and health explicitly', () => {
    expect(moduleRegistry.modules).toEqual([authModule, paymentModule, healthModule])
    expect(moduleRegistry.getModule('payment')).toBe(paymentModule)
    expect(moduleRegistry.getModule('payment').dependencies).toContain('auth')
    expect(moduleRegistry.getModule('health')).toBe(healthModule)
    expect(moduleRegistry.getModule('health').dependencies).toContain('auth')
  })
})
