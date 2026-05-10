import { describe, expect, it } from 'vitest'
import { healthModule } from './module'
import { HealthReportService } from './shared/services/health-report.service'

describe('healthModule', () => {
  it('declares auth dependency and stable health services', () => {
    expect(healthModule.key).toBe('health')
    expect(healthModule.dependencies).toEqual(['auth'])
    expect(healthModule.exports?.services).toEqual({
      HealthReportService,
    })
  })
})
